const axios = require('axios');

const queue_url = process.env.QUEUE_URL + "jobs/";

function assert(b) {
    if(!b) {
        //console.trace();
        throw new Error('Assert Failed!');
    }
}

function hx(id=1) {
    return {headers: {QUEUE_CONSUMER: id}};
}

async function main() {
    try {
        var res = null;

        res = await axios.get(queue_url + "enqueue").catch(err => err?.response);
        assert(res.status == 400);

        res = await axios.get(queue_url + "dequeue", hx(1)).catch(err => err?.response);
        assert(res.status == 404);

        res = await axios.post(queue_url + "enqueue", {}).catch(err => err?.response);
        assert(res.status == 400);

        res = await axios.post(queue_url + "enqueue", {name: "asd"}).catch(err => err?.response);
        assert(res.status == 400);

        res = await axios.post(queue_url + "enqueue", {Type: "TIME_CRITICAL"}).catch(err => err?.response);
        assert(res.status == 200);
        assert(res.data == 1);

        res = await axios.post(queue_url + "enqueue", {Type: "NOT_TIME_CRITICAL"}).catch(err => err?.response);
        assert(res.status == 200);
        assert(res.data == 2);

        res = await axios.get(queue_url + "dequeue", hx(1)).catch(err => err?.response);
        assert(res.status == 200);
        assert(res.data.ID == 1);

        res = await axios.get(queue_url + "dequeue", hx(1)).catch(err => err?.response);
        assert(res.status == 200);
        assert(res.data.ID == 2);

        res = await axios.get(queue_url + "dequeue", hx(1)).catch(err => err?.response);
        assert(res.status == 404);

        res = await axios.post(queue_url + 1 + "/conclude", "", hx(2)).catch(err => err?.response);
        assert(res.status == 400);

        res = await axios.post(queue_url + 1 + "/conclude", "", hx(1)).catch(err => err?.response);
        assert(res.status == 200);

        res = await axios.post(queue_url + 2 + "/conclude", "", hx(1)).catch(err => err?.response);
        assert(res.status == 200);

        res = await axios.post(queue_url + 3 + "/conclude", "", hx(1)).catch(err => err?.response);
        assert(res.status == 404);

        // Wait for GC
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const sec = Number(process.env.SLEEP ? process.env.SLEEP : 60);
        await sleep(sec*1000); // 3 min

        console.log("All tests passed!");
    } catch (err) {
        console.error(err);
    }
}
main();
