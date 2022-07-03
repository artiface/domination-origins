import asyncio

import requests.exceptions


class Listener:
    def __init__(self, on_raw_event_callback):
        self.on_raw_event = on_raw_event_callback

    async def log_loop(self, filters, poll_interval):
        while True:
            for index, filterItem in filters:
                entries = []
                try:
                    entries = filterItem.get_new_entries()
                except requests.exceptions.HTTPError as e:
                    print(e)
                for event in entries:
                    self.on_raw_event(index, event)
            await asyncio.sleep(poll_interval)

    def listen(self, event_list):
        filters = []
        # iterate with index
        for index, event in enumerate(event_list):
            filters.append((index, event.createFilter(fromBlock='latest')))
        loop = asyncio.get_event_loop()
        try:
            loop.run_until_complete(asyncio.gather(self.log_loop(filters, 4)))
        finally:
            loop.close()
