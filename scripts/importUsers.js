const fs = require('fs/promises');
const cp = require('child_process');

const containerName = 'doma-freeswitch-1';
const directoryPath = '/usr/local/freeswitch/conf/directory/default';
const fsCli = '/usr/local/freeswitch/bin/fs_cli';

const template = `<include>
<user id="{number}">
  <params>
    <param name="password" value="{password}"/>
    <param name="vm-password" value="{number}"/>
  </params>
  <variables>
    <variable name="toll_allow" value="domestic,international,local"/>
    <variable name="accountcode" value="{number}"/>
    <variable name="user_context" value="default"/>
    <variable name="effective_caller_id_name" value="{number}"/>
    <variable name="effective_caller_id_number" value="{number}"/>
    <variable name="outbound_caller_id_name" value="\$\${outbound_caller_name}"/>
    <variable name="outbound_caller_id_number" value="\$\${outbound_caller_id}"/>
  </variables>
</user>
</include>`;

const formatTemplate = (number, password) => {
    const numberRegex = new RegExp(`\{number\}`, 'g');
    const passwordRegex = new RegExp(`\{password\}`, 'g');
    return template
        .replace(numberRegex, number)
        .replace(passwordRegex, password);
}

const saveUser = async (number, content) => {
    const child = cp.spawn('docker', ['exec', '-i', containerName, 'tee', `${directoryPath}/${number}.xml`]);
    const promise = new Promise(r => child.on('close', r));
    child.stdin.write(content);
    child.stdin.end();

    await promise;
};

const reloadXML = async () => {
    const child = cp.spawn('docker', ['exec', '-i', containerName, fsCli, '-x', 'reloadxml']);
    const promise = new Promise(r => child.on('close', r));

    await promise;
}

const main = async () => {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: node importUsers.js users.csv');
        process.exit(1);
    }

    const fname = args[0];
    const fileContents = await fs.readFile(fname, 'utf-8');
    const lines = fileContents.split('\n').map(l => l.trim().split(','));

    for (const [number, password] of lines) {
        if (number && password) {
            console.log(`Importing ${number}...`);
            const content = formatTemplate(number, password);
            await saveUser(number, content);
        }
    }

    console.log(`Reloading FreeSWITCH...`);
    await reloadXML();
};

main().catch(console.error);