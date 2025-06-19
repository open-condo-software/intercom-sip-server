local caller = argv[2]
local callee = argv[1]
local queue_name = callee .. "@default"

freeswitch.consoleLog("NOTICE", "********* Incoming: " .. callee .. " from " .. caller .. " ***********\n");

local cmd = string.format("sh /usr/local/freeswitch/scripts/sh/on_join.sh \"%s\" \"%s\"", caller:gsub('([%(%)])', '\\%1'), queue_name:gsub('([%(%)])', '\\%1'))
os.execute(cmd)

function make_call(timeout)
    params = "{ignore_early_media=true,originate_timeout=" .. timeout .. ",hangup_after_bridge=true,media_mix_inbound_outbound_codecs=true,inherit_codec=false}"
    ostr = params .. "user/" .. callee;
    freeswitch.consoleLog("notice", "*********** Dialing: " .. ostr .. " ***********\n");

    outgoingSession = freeswitch.Session(ostr, session);
    local hcause = outgoingSession:hangupCause();
    freeswitch.consoleLog("notice", "*********** Cause: " .. hcause .. " ***********\n");

    if (session:ready() and outgoingSession:ready()) then
        freeswitch.consoleLog("notice", "*********** (" .. ostr .. ") CONNECTED! ***********\n");
        freeswitch.bridge(session, outgoingSession);
        if (session:ready()) then
            session:hangup();
        end
        if (outgoingSession:ready()) then
            outgoingSession:hangup();
        end
        return true
    end

    return false
end

api = freeswitch.API();
con = freeswitch.EventConsumer("CUSTOM", "sofia::register");

session:preAnswer()

while session:ready() do
    session:sleep(1000)

    local e = con:pop()

    if e then
        local code = e:getHeader('accountcode') or ""
        local ip = e:getHeader('network-ip') or ""
        local port = e:getHeader('network-port') or ""
        if code == callee then
            freeswitch.consoleLog("notice", "*********** code: " .. code .. ", " .. ip .. ":" .. port .. " ***********\n");
            freeswitch.consoleLog("notice", "*********** Event: " .. e:serialize() .. " ***********\n");

            session:sleep(2000)
            if make_call(180) then
                break
            end
        end
    else
        local regs = api:executeString("sofia status profile internal reg");
        for k, v in string.gmatch(regs, "([%w-]+):%s*([^\n]+)") do
            if k == 'Auth-User' and v == callee then
                make_call(5)
                break
            end
        end
    end
end