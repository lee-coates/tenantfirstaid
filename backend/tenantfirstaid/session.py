import os
from redis import Redis
import simplejson as json


class TenantSession:
    def __init__(self):
        self.redis_con = Redis(
            host="127.0.0.1", port=6379, password=os.getenv("REDIS_PASSWORD")
        )

    def get(self, session_id):
        return json.loads(self.redis_con.get(session_id) or "[]")

    def set(self, session_id, value):
        self.redis_con.set(session_id, json.dumps(value))
