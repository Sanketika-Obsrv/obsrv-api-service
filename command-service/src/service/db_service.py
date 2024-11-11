import psycopg2
import psycopg2.extras

from typing import Callable
from tenacity import retry, stop_after_attempt, wait_exponential
from config import Config

def reconnect(func: Callable):

    def wrapper(db_connection, *args, **kwargs):
        tdecorator = retry(wait=wait_exponential(), stop=stop_after_attempt(3))
        decorated = tdecorator(func)
        return decorated(db_connection, *args, **kwargs)

    return wrapper


class DatabaseService:

    def __init__(self):
        self.config = Config()

    def connect(self):
        # print("Connecting to postgresql db...")
        db_host = self.config.find("postgres.db_host")
        db_port = self.config.find("postgres.db_port")
        db_user = self.config.find("postgres.db_user")
        db_password = self.config.find("postgres.db_password")
        database = self.config.find("postgres.database")
        db_connection = psycopg2.connect(
            database=database,
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
        )
        db_connection.autocommit = True
        return db_connection

    # @reconnect
    def execute_select_one(self, sql, params):
        db_connection = self.connect()
        cursor = db_connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(sql, params)
        result = cursor.fetchone()
        db_connection.close()
        return result

    # @reconnect
    def execute_select_all(self, sql, params):
        db_connection = self.connect()
        cursor = db_connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(sql, params)
        result = cursor.fetchall()
        db_connection.close()
        return result

    # @reconnect
    def execute_upsert(self, sql, params):
        db_connection = self.connect()
        cursor = db_connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(sql, params)
        db_connection.commit()
        record_count = cursor.rowcount
        db_connection.close()
        return record_count

# @reconnect
    def execute_delete(self, sql, params):
        db_connection = self.connect()
        cursor = db_connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(sql, params)
        db_connection.close()
