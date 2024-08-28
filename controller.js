const { convertAndValidatePhoneNumber, generateToken } = require("./helper");
const handleError = require("http-errors");

const recordAction = {
    action: "record",
    eventUrl: "https://webhook.site/40b38887-d942-4e12-ae54-ced7ff294a6f", //change STRINGEE_EVENT_URL in .env
    format: "",
};
const connectAction = {
    action: "connect",
    from: {
        type: "",
        number: "",
        alias: "",
    },
    to: {
        type: "",
        number: "",
        alias: "",
    },
    customData: '{\n  name: "NDK",\n  content: "custom data from backend"\n}',
    timeout: null,
    continueOnFail: false,
    onFailEventUrl: "",
    maxConnectTime: -1,
    peerToPeerCall: false,
};

const controller = {
    getCustomerInfo: async (req, res, next) => {
        //Chỗ này xử lý Get customer info URL ở https://pcc.stringee.com/setting/callsetting
        try {
            const query = { ...req.query };
            console.log("Get customer info query: ", query);
            const resObj = {
                query: query,
                message: "This is data from get customer info URL",
            };
            return res.send(resObj);
        } catch (err) {
            next(err);
        }
    },
    getList: async (req, res, next) => {
        //Sửa đổ call về agent bằng getList ở đây
        try {
            let callId = req.body.calls[0].callId;
            const resObj = {
                version: 2,
                calls: [
                    {
                        callId: callId,
                        agents: [
                            {
                                stringee_user_id: "222",
                                routing_type: 1,
                                answer_timeout: 5,
                            },
                            {
                                stringee_user_id: "333",
                                routing_type: 1,
                                answer_timeout: 5,
                            },
                            {
                                stringee_user_id: "444",
                                routing_type: 1,
                                answer_timeout: 5,
                            },
                        ],
                    },
                ],
            };
            return res.send(resObj);
        } catch (err) {
            next(err);
        }
    },
    answerUrl: async (req, res, next) => {
        try {
            const record = { ...recordAction };
            const connect = { ...connectAction };
            const query = { ...req.query };
            switch (query.fromInternal) {
                case "true":
                    //Gọi ra
                    if (query.videocall === "true") {
                        record.format = "webm";
                        record.record_type = 2;
                        connect.from.type = "internal";
                        connect.to.type = "internal";
                        connect.from.number = query.userId;
                        connect.from.alias = query.userId;
                        connect.to.number = query.to;
                        connect.to.alias = query.to;
                    } else {
                        record.format = "mp3";
                        record.recordStereo = true;
                        if (convertAndValidatePhoneNumber(query.from)) {
                            connect.from.type = "internal";
                            connect.to.type = "external";
                            connect.from.number = query.from;
                            connect.from.alias = query.from;
                            connect.to.number = query.to.replace(/^0/, "84");
                            connect.to.alias = query.to.replace(/^0/, "84");
                        } else {
                            connect.from.number = query.userId;
                            connect.from.alias = query.userId;
                            connect.from.type = "internal";
                            connect.to.type = "internal";
                            connect.to.number = query.to;
                            connect.to.alias = query.to;
                        }
                    }
                    connect.timeout = parseInt(process.env.STRINGEE_OUTBOUND_TIMEOUT);
                    break;
                case "false":
                    //Gọi vào, continueOnFail sẽ update sau
                    record.format = "mp3";
                    connect.from.type = "external";
                    connect.to.type = "internal";
                    connect.from.number = query.from;
                    connect.from.alias = query.from;
                    connect.to.number = "agent1"; //Sửa userId nếu ko muốn đổ về agent này
                    connect.to.alias = "agent1";
                    connect.timeout = parseInt(process.env.STRINGEE_INBOUND_TIMEOUT);
                    connect.continueOnFail = true;
                    connect.onFailEventUrl = "https://zgyz6v-10000.csb.app/on-fail-url";
                    break;
                default:
                    break;
            }
            return res.send([record, connect]);
        } catch (err) {
            next(err);
        }
    },
    onFailUrl: async (req, res, next) => {
        try {
            const record = { ...recordAction };
            const connect = { ...connectAction };
            const bodyRequest = { ...req.body };
            record.format = "mp3";
            connect.from.type = "external";
            connect.to.type = "internal";
            connect.from.number = bodyRequest.from.number;
            connect.from.alias = bodyRequest.from.alias;
            connect.timeout = parseInt(process.env.STRINGEE_INBOUND_TIMEOUT);
            connect.continueOnFail = true;
            connect.onFailEventUrl = "https://zgyz6v-10000.csb.app/on-fail-url";
            switch (bodyRequest.to.number) {
                case "agent1":
                    console.log(
                        "1 không nghe máy, lý do: " +
                        bodyRequest.endCallCause +
                        ", đổ đến 2",
                    );
                    connect.to.number = "agent2";
                    connect.to.alias = "agent2";
                    break;
                case "agent2":
                    console.log(
                        "2 không nghe máy, lý do: " +
                        bodyRequest.endCallCause +
                        ", đổ đến 3",
                    );
                    connect.to.number = "agent3";
                    connect.to.alias = "agent3";
                    break;
                case "agent3":
                    console.log(
                        "3 không nghe máy, lý do: " +
                        bodyRequest.endCallCause +
                        ", đổ đến 1",
                    );
                    connect.to.number = "agent1";
                    connect.to.alias = "agent1";
                    break;
                default:
                    break;
            }
            return res.send([record, connect]);
        } catch (err) {
            next(err);
        }
    },
    generateClientToken: async (req, res, next) => {
        try {
            const query = { ...req.query };
            if (!query || !query.userId)
                throw handleError.NotFound("Missing userId field");
            if (query && query.userId.length > 36)
                throw handleError.BadRequest("UserId is lower than 36 characters");
            if (query && !query.icc) {
                throw handleError.BadRequest("Missing icc field");
            }
            const token = generateToken(query.icc === "true" ? "icc" : "noicc", query.userId, null);
            return res.send({ clientToken: token });
        } catch (err) {
            next(err);
        }
    },
    generateRestToken: async (req, res, next) => {
        try {
            const token = generateToken("rest", null, null);
            return res.send({ restToken: token });
        } catch (err) {
            next(err);
        }
    },
    generateRoomToken: async (req, res, next) => {
        try {
            const query = { ...req.query };
            if (!query || !query.roomId)
                throw handleError.NotFound("Missing roomId field");
            const token = generateToken("room", null, query.roomId);
            return res.send({ roomToken: token });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = controller;
