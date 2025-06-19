import { FreeSwitchResponse, FreeSwitchServer, type FreeSwitchServerLogger } from 'esl';
import { setTimeout as delay } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';

const CALL_TIMEOUT_MS = parseInt(process.env.CALL_TIMEOUT ?? '180') * 1000;

const logger: FreeSwitchServerLogger = {
    debug: () => { },
    info: () => { },
    error: () => { },
};

const server = new FreeSwitchServer({
    all_events: true,
    my_events: true,
    logger,
});

const originalLog = console.log;
const originalError = console.error;

console.log = (...args: any) => originalLog(`[${new Date().toISOString()}]`, ...args);
console.error = (...args: any) => originalError(`[${new Date().toISOString()}]`, ...args);

async function sendPush(fromUser: string, toUser: string, cancel = false) {
    const url = cancel ? process.env.CANCEL_URL : process.env.PUSH_URL;
    const pushApiKey = process.env.PUSH_API_KEY;
    if (fromUser && toUser && url && pushApiKey) {
        const response = await fetch(`${url}/${toUser}`, {
            headers: {
                Authorization: `Bearer ${pushApiKey}`,
            },
        });
        const result = await response.text();
        if (response.ok) {
            console.log(`[sendPush to=${toUser} cancel=${cancel}] push ${cancel ? 'canceled' : 'sent'}, response="${result}"`);
        } else {
            console.error(`[sendPush to=${toUser} cancel=${cancel}] push ${cancel ? 'cancel' : 'sending'} error, response="${result}"`);
        }
    } else {
        console.error(
            `[sendPush cancel=${cancel}] Missing required parameters:`,
            Object.entries({ fromUser, toUser, url, pushApiKey })
                .filter(entry => !entry[1])
                .map(entry => entry[0])
                .join(', ')
        );
    }
}

function getCallString(contact: string, uuid: string): string {
    return `{ignore_early_media=true,origination_uuid=${uuid},originate_timeout=180,hangup_after_bridge=true}${contact}`;
}

async function closeCalls(
    freeswitch: FreeSwitchResponse,
    calls: Map<string, string>,
    connectedUuid: string | null,
    fromUser: string,
    toUser: string,
): Promise<void> {
    await sendPush(fromUser, toUser, true);
    for (const [contact, uuid] of calls) {
        if (uuid === connectedUuid) continue;
        freeswitch.bgapi(`uuid_kill ${uuid}`).then(
            () => {
                console.log(`[closeCalls] closed ${uuid}`);
                calls.delete(contact);
            },
            () => { }
        );
    }
}

server.on('connection', async (call, { data, uuid: incomingUuid }) => {
    try {
        const fromUser = data.variable_sip_from_user;
        const toUser = data.variable_sip_to_user;
        console.log(`[on connection uuid=${incomingUuid}] received call ${fromUser} => ${toUser}`);

        if (fromUser && toUser) {
            await sendPush(fromUser, toUser);
            console.log(`[on connection uuid=${incomingUuid}] sent push`);

            await call.command('ring_ready');
            console.log(`[on connection uuid=${incomingUuid}] sent ring ready`);

            let hangup = false;
            const calls = new Map<string, string>();
            let connectedUuid: string | null = null;

            await call.linger();
            setTimeout(() => {
                call.hangup().catch(() => { });
                hangup = true;
            }, CALL_TIMEOUT_MS);

            call.on('CHANNEL_HANGUP', async (event) => {
                if (event.body.variable_call_uuid === incomingUuid || event.body.variable_call_uuid === connectedUuid) {
                    console.log(`[on connection uuid=${incomingUuid}] hangup`);
                    await closeCalls(call, calls, connectedUuid, fromUser, toUser);
                    hangup = true;
                }
            });

            while (!connectedUuid && !hangup) {
                const contactsResponse = await call.bgapi(`sofia_contact ${toUser}`).catch(error => ({ error }));
                if (hangup || 'error' in contactsResponse || !contactsResponse.body?._body) {
                    console.log(`[on connection uuid=${incomingUuid}] call closed`);
                    await closeCalls(call, calls, connectedUuid, fromUser, toUser);
                    break;
                }
                const contacts = new Set(contactsResponse.body._body.split(','));

                for (const contact of contacts) {
                    if (connectedUuid || hangup) break;
                    if (contact === 'error/user_not_registered') continue;
                    if (calls.has(contact)) continue;

                    const contactUuid = randomUUID();
                    calls.set(contact, contactUuid);

                    console.log(`[on connection uuid=${incomingUuid}] trying to call ${contact}(${contactUuid})`);

                    call.bgapi(`originate ${getCallString(contact, contactUuid)} &park()`)
                        .then(async (result) => {
                            if (connectedUuid || hangup) return;
                            if (result.body._body?.startsWith('-ERR ')) {
                                throw new Error(result.body._body);
                            }

                            await call.command('pre_answer');
                            connectedUuid = contactUuid;
                            await closeCalls(call, calls, connectedUuid, fromUser, toUser);

                            const bridgeResult = await call.bgapi(`uuid_bridge ${incomingUuid} ${contactUuid}`);

                            if (bridgeResult.body._body?.startsWith('-ERR ')) {
                                throw new Error(result.body._body);
                            }
                        }).catch((error) => {
                            console.error(`[on connection uuid=${incomingUuid}] error: ${error}`);
                        });
                }
                await delay(1000);
            }
            if (connectedUuid) {
                console.log(`[on connection uuid=${incomingUuid}] call connected ${connectedUuid}`);
            }
        }
    } catch (e) {
        console.error(`[on connection] Error:`, e);

        await call.hangup();
    }
});

server.on('drop', (data) => {
    console.log(`[on drop]`, data);
});

server.on('error', (err) => {
    console.error(`[on error]`, err);
});

server.listen({ port: 7000 }).catch((err) => {
    console.error(`[server.listen] Error:`, err);
});