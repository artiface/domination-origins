import asyncio


class Listener:
    def __init__(self, on_raw_event_callback):
        self.on_raw_event = on_raw_event_callback

    async def log_loop(self, filters, poll_interval):
        while True:
            for filterItem in filters:
                for event in filterItem.get_new_entries():
                    self.on_raw_event(event)
            await asyncio.sleep(poll_interval)

    def listen(self, event_list):
        filters = []
        for event in event_list:
            filters.append(event.createFilter(fromBlock='latest'))
        loop = asyncio.get_event_loop()
        try:
            loop.run_until_complete(asyncio.gather(self.log_loop(filters, 2)))
        finally:
            loop.close()
