import csv
import logging
import os
from enum import Enum

import boto3
import requests
from pydantic_settings import BaseSettings

from generate_users import generate_users

logging.basicConfig(
    filename='auto_run_generate_users_script.log',
    filemode='a',
    format='%(asctime)s - %(levelname)s - %(filename)s - %(message)s',
    level=logging.INFO, 
)

logger = logging.getLogger(__name__)

class LogLevel(Enum):
    """
    Enum for logging level.
    """
    error = 1
    info = 0


class TgNotificationConfig(BaseSettings):
    """
    Configuration for Telegram notification settings.

    Attributes:
        chatId (str): The Telegram chat ID to send notifications to.
        logLevel (str): The log level that determines which messages should be sent (e.g., "info", "error").
    """
    chatId: str
    logLevel: str

    class Config:
        arbitrary_types_allowed = True

class Settings(BaseSettings):
    """
    Class for loading and validating settings from environment variables.

    Attributes:
        bucket_name (str): Name of the S3 bucket.
        region (str): AWS region.
        iam_user_access_key (str): IAM user access key for AWS.
        iam_user_secret_key (str): IAM user secret key for AWS.
        obs_cloud_url (str): URL for the OBS cloud (if applicable).
        users_dir (str): Directory for storing downloaded files.
        tg_bot_token (str): Telegram bot token for notifications.
        tg_notifications_config (list[TgNotificationConfig]): List of Telegram chat configurations.
        server_name (str): Name of the server.
    """
    bucket_name: str
    region: str
    iam_user_access_key: str
    iam_user_secret_key: str
    obs_cloud_url: str
    users_dir: str
    tg_bot_token: str
    tg_notifications_config: list[TgNotificationConfig] = []
    server_name: str
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"


def start_message(server_name: str) -> str:
    """
    Generates a start message for Telegram notification indicating
    that data loading to the SIP server has begun.
    
    Args:
        server_name (str): The name of the server.

    Returns:
        str: A message indicating the start of data loading.
    """
    return f"{server_name}! Data upload to the SIP server has started."


def end_message(server_name: str) -> str:
    """
    Generates an end message for Telegram notification indicating
    that data loading to the SIP server has been completed successfully.
    
    Args:
        server_name (str): The name of the server.

    Returns:
        str: A message indicating the successful completion of data upload.
    """
    return f"{server_name}! Data upload to the SIP server was successful."


def error_message(server_name: str, exception: Exception) -> str:
    """
    Generates an error message for Telegram notification indicating
    that an error occurred during the data upload to the SIP server.
    
    Args:
        server_name (str): The name of the server.
        exception (Exception): The exception that occurred.

    Returns:
        str: A message indicating the error and details of the exception.
    """
    return f"{server_name}! An error occurred during data upload to the SIP server: {exception}"


def write_data_to_csv_file(data, filename: str, users_dir: str):
    """
    Writes the provided data to a CSV file in the specified directory.
    
    Args:
        data (bytes): The raw data to write to the CSV file.
        filename (str): The name of the file to be written.
        users_dir (str): The directory where the file will be saved.

    Raises:
        OSError: If there is an error while writing the file.
    """
    decoded_data = data.decode('utf-8').strip()
    lines = decoded_data.splitlines()

    with open(os.path.join(users_dir, filename), mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, delimiter=';', quoting=csv.QUOTE_MINIMAL)
        
        for line in lines:
            writer.writerow(line.split(';'))


def create_temp_file(temp_file: str):
    """
    Creates a temporary file to indicate that the script is currently running.
    
    Args:
        temp_file (str): The name of the temporary file to create.

    Raises:
        OSError: If there is an error while creating the temporary file.
    """
    try:
        with open(temp_file, 'w') as running_file:
            running_file.write("generate_users.py script is executed")
    except OSError as e:
        logger.error(f"Failed to create temp file {temp_file}: {e}")


def run_generate_users_script(settings: Settings, temp_file: str,):
    """
    Runs the 'generate_users.py' script and sends Telegram messages
    indicating the status of the process.
    
    Args:
        temp_file (str): The name of the temporary file used to check if the script is running.
        settings (Settings): App settings.

    Raises:
        Exception: If an error occurs while running the external script.
    """
    send_telegram_message(
        tg_bot_token=settings.tg_bot_token, 
        tg_notifications_config=settings.tg_notifications_config, 
        message_text=start_message(server_name=settings.server_name),
        message_level=LogLevel.info
    )
    try:
        logger.info("Script execution start")
        generate_users()

        logger.info("Script execution complete")
        send_telegram_message(
            tg_bot_token=settings.tg_bot_token,
            tg_notifications_config=settings.tg_notifications_config, 
            message_text=end_message(server_name=settings.server_name),
            message_level=LogLevel.info
        )
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        send_telegram_message(
            tg_bot_token=settings.tg_bot_token, 
            tg_notifications_config=settings.tg_notifications_config, 
            message_text=error_message(server_name=settings.server_name, exception=e),
            message_level=LogLevel.error
        )
    finally:
        os.remove(temp_file)
        logger.info(f"Temp file {temp_file} has been deleted")


def is_generate_users_script_running(temp_file: str) -> bool:
    """
    Checks whether the temporary file indicating that the script is running exists.
    
    Args:
        temp_file (str): The name of the temporary file to check.

    Returns:
        bool: True if the temporary file exists (script is running), False otherwise.
    """
    return os.path.exists(temp_file)


def send_telegram_message(tg_bot_token: str, tg_notifications_config: list[TgNotificationConfig], message_text: str, message_level: LogLevel):
    """
    Sends a message to the specified Telegram chat(s) using the provided bot token.
    
    Args:
        tg_bot_token (str): The Telegram bot token.
        tg_notifications_config (list[TgNotificationConfig]): List of chat configurations to send the message to.
        message_text (str): The text message to send.
        message_level (LogLevel): Logging message level.

    Raises:
        requests.exceptions.RequestException: If there is an error while sending the message.
    """
    send_message_url = f'https://api.telegram.org/bot{tg_bot_token}/sendMessage'
    message_level_value = message_level.value
    
    for chat in tg_notifications_config:
        chat_level_value = LogLevel[chat.logLevel].value

        if message_level_value >= chat_level_value:
            payload: dict
            if '/' in chat.chatId:
                parts = chat.chatId.rsplit('/', 1)
                main_chat_id = parts[0]
                message_thread_id = parts[1]
                payload = {
                    'chat_id': main_chat_id,
                    'message_thread_id': message_thread_id,
                    'text': message_text
                }
            else:
                payload = {
                    'chat_id': chat.chatId,
                    'text': message_text
                }
            try:
                response = requests.post(send_message_url, data=payload)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                print(e)


def main(temp_file: str):
    """
    Main logic of the script. Downloads files from an S3 bucket, processes them,
    and runs the generate_users.py script if new files are found.
    
    Args:
        temp_file (str): The name of the temporary file used to check if the script is running.
    
    Raises:
        OSError: If there is an error while removing the temporary file.
    """
    try:
        settings = Settings()
    except Exception as e:
        logger.error(f"Env error: {e}")
        os.remove(temp_file)
        exit(1)

    s3_client = boto3.client(
        service_name='s3',
        aws_access_key_id=settings.iam_user_access_key,
        aws_secret_access_key=settings.iam_user_secret_key,
        region_name=settings.region,
        endpoint_url=settings.obs_cloud_url
    )
    
    bucket_data = s3_client.list_objects(Bucket=settings.bucket_name)

    if 'Contents' in bucket_data:
        logger.info("New files detected")
        
        for key in bucket_data['Contents']:
            object_name = key['Key']
            logger.info(f"File detected: {object_name}")

            get_object_response = s3_client.get_object(Bucket=settings.bucket_name, Key=object_name)
            object_data = get_object_response['Body'].read()

            write_data_to_csv_file(data=object_data, filename=object_name, users_dir=settings.users_dir)
            logger.info(f"File '{object_name}' written to '{settings.users_dir}'")

            s3_client.delete_object(Bucket=settings.bucket_name, Key=object_name)
            logger.info(f"File '{object_name}' has been removed from the S3 bucket")

        run_generate_users_script(
            settings=settings,
            temp_file=temp_file, 
        )
    else:
        logger.info("No new files detected")
        try:
            os.remove(temp_file)
        except OSError as e:
            logger.error(f"Failed to delete temp file {temp_file}: {e}")


if __name__ == "__main__":
    """
    Entry point for the script. Checks if the script is already running based on the temporary file.
    If not, it starts the process by calling the main function.
    """
    temp_file = 'generate_users_is_running.temp'
    
    if not is_generate_users_script_running(temp_file):
        create_temp_file(temp_file=temp_file)
        main(temp_file=temp_file)
    else:
        logger.info("Script generate_users.py is already running")
