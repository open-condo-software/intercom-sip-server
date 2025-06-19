import csv
import logging
import os
import subprocess

logging.basicConfig(
    filename='auto_run_generate_users_script.log',
    filemode='a',
    format='%(asctime)s - %(levelname)s - %(filename)s - %(message)s',
    level=logging.INFO, 
)

logger = logging.getLogger(__name__)

input_users_dirpath="input-users"
output_users_dirpath="output-users"

users_teplate = """
<include>
{users}
</include>
""".strip()

intercom_template = """
<user id="{extension}">
    <params>
        <param name="password" value="{password}"/>
    </params>
    <variables>
        <variable name="toll_allow" value="domestic,international,local"/>
        <variable name="accountcode" value="{extension}"/>
        <variable name="user_context" value="intercoms-main"/>
        <variable name="effective_caller_id_name" value="{extension}"/>
        <variable name="effective_caller_id_number" value="{extension}"/>
        <variable name="outbound_caller_id_name" value="$${{outbound_caller_name}}"/>
        <variable name="outbound_caller_id_number" value="$${{outbound_caller_id}}"/>
        <variable name="sip-force-expires" value="30"/>
        <variable name="X-Doma-AI-Type" value="intercom"/>
    </variables>
</user>
"""

apartment_template = """
<user id="{extension}">
    <params>
        <param name="password" value="{password}"/>
        <param name="vm-password" value="{extension}"/>
    </params>
    <variables>
        <variable name="absolute_codec_string" value="OPUS,G722,PCMU,PCMA,VP8"/>
        <variable name="toll_allow" value="domestic,international,local"/>
        <variable name="accountcode" value="{extension}"/>
        <variable name="user_context" value="rooms-main"/>
        <variable name="effective_caller_id_name" value="room house 1 apart 1"/>
        <variable name="effective_caller_id_number" value="room-1-1"/>
        <variable name="outbound_caller_id_name" value="$${{outbound_caller_name}}"/>
        <variable name="outbound_caller_id_number" value="$${{outbound_caller_id}}"/>
        <variable name="sip-force-expires" value="30"/>
        <variable name="X-Doma-AI-Type" value="apartment"/>
    </variables>
</user>
"""

def fs_cli(cmd):
    password = os.getenv('SOCKET_PASSWORD').strip()
    try:
        subprocess.run([
            'docker', 'compose', 'exec', '-Td', 'sip-server',
            '/usr/local/freeswitch/bin/fs_cli', '-rRS', '--password', password, '-x',
            cmd
        ])
    except Exception as e:
        logger.error('Exception while calling fs_cli: {e}')

def reload_xml():
    logger.info('Reloading XML...')
    fs_cli("reloadxml")

def transliterate(s):
    replacements = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        ' .,;:-!?*&@#$%^()[]{}|\\\'"<>': '_',
    }
    for replace_from, replace_to in replacements.items():
        for c in replace_from:
            s = s.replace(c, replace_to)
    
    # Original script had a bug, which adds a _ to the end of the string
    return s + '_'

def import_dotenv():
    if not os.path.exists('.env'):
        return
    
    logger.info('Importing .env...')

    with open('.env') as e:
        for line in e:
            try:
                key, *rest = line.split('=')
                os.environ[key.strip()] = '='.join(rest).strip()
            except: pass

def read_input_users():
    if not os.path.isdir(input_users_dirpath):
        return {}
    
    logger.info('Reading input users...')
    
    result = {}
    for group in os.listdir(input_users_dirpath):
        fname = os.path.join(input_users_dirpath, group)
        output_fname = transliterate(os.path.splitext(group)[0])
        with open(fname) as f:
            reader = csv.DictReader(f, delimiter=';')
            result[output_fname] = list(reader)
    
    return result

def generate_configs(users):
    logger.info('Generating configs...')
    
    for fname, group in users.items():
        group_users = []
        for user in group:
            if user['kvartira'] == 'x':
                user_xml = intercom_template.format(**user)
            else:
                user_xml = apartment_template.format(**user)
            group_users.append(user_xml)

        with open(os.path.join(output_users_dirpath, fname + '.xml'), 'w') as f:
            f.write(users_teplate.format(users='\n'.join(group_users)))
    
def generate_users():
    import_dotenv()
    input_users = read_input_users()

    generate_configs(input_users)
    reload_xml()

if __name__ == '__main__':
    generate_users()