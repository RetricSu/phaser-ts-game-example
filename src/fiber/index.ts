import { FiberNode } from "./node";

const node1 = {
    peerId: "QmdW4WGRUfqQ8hx92Uaufx4n3TXrJUoDP666BQwbqiDrnv",
    address:
        "/ip4/127.0.0.1/tcp/8228/p2p/QmdW4WGRUfqQ8hx92Uaufx4n3TXrJUoDP666BQwbqiDrnv",
    url: "/node1-api",
    active_channel_id:
        "0x293e08c81ff93ef9ef2a21ab56eb058ff6546c5bb63768b999565c5125f53846",
};

const node2 = {
    peerId: "QmcFpUnjRvMyqbFBTn94wwF8LZodvPWpK39Wg9pYr2i4TQ",
    address:
        "/ip4/127.0.0.1/tcp/8238/p2p/QmcFpUnjRvMyqbFBTn94wwF8LZodvPWpK39Wg9pYr2i4TQ",
    url: "/node2-api",
};

const amountPerShotHit = "0x2540be400"; // 100 CKB

export async function prepareNodes() {
    const bossNode = new FiberNode(node1.url, node1.peerId, node1.address);
    const playerNode = new FiberNode(node2.url, node2.peerId, node2.address);
    console.log("bossNode", bossNode);
    console.log("playerNode", playerNode);

    await bossNode.rpc.connectPeer({
        address: playerNode.address,
    });

    const myChannels = await bossNode.rpc.listChannels({
        peer_id: playerNode.peerId,
    });
    const activeChannel = myChannels.channels.filter(
        (channel) => channel.state.state_name === "CHANNEL_READY",
    );
    console.log("activeChannel", activeChannel);
    return { bossNode, playerNode };
}

export async function scorePoint(bossNode: FiberNode, playerNode: FiberNode) {
    const invoice = await playerNode.createCKBInvoice(
        amountPerShotHit,
        "player hit the boss!",
    );
    console.log("invoice", invoice);
    const result = await bossNode.sendPayment(invoice.invoice_address);
    console.log("payment result", result);
}

export async function losePoint(bossNode: FiberNode, playerNode: FiberNode) {
    const invoice = await bossNode.createCKBInvoice(
        amountPerShotHit,
        "boss hit the player!",
    );
    console.log("invoice", invoice);
    const result = await playerNode.sendPayment(invoice.invoice_address);
    console.log("payment result", result);
}
