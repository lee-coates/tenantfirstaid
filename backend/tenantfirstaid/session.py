import os
from valkey import Valkey
import simplejson as json


class TenantSession:
    def __init__(self):
        print("Connecting to Valkey:", {
            "host": os.getenv("DB_HOST"),
            "port": os.getenv("DB_PORT"),
            "ssl": os.getenv("DB_USE_SSL"),
        })
        try:
            self.db_con = Valkey(
                host=os.getenv("DB_HOST", "127.0.0.1"),
                port=os.getenv("DB_PORT", 6379),
                password=os.getenv("DB_PASSWORD"),
                ssl=True if os.getenv("DB_USE_SSL") == "true" else False,
            )
            self.db_con.ping()

        except Exception as e:
            print(e)

    def get(self, session_id):
        print("Connection to Valkey:", {
            "host": os.getenv("DB_HOST"),
            "port": os.getenv("DB_PORT"),
            "ssl": os.getenv("DB_USE_SSL"),
        })
        print("self.db_con", self.db_con)
        return json.loads(self.db_con.get(session_id) or "[]")

    def set(self, session_id, value):
        self.db_con.set(session_id, json.dumps(value))
