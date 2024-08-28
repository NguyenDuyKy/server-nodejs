const jwt = require("jsonwebtoken");

const phoneRegex =
    /^(0|84)(3[2-9]|5[2689]|7[06789]|8[1-9]|9[0-46-9])[0-9]{7}$|^(0|84)(2[0-9]{1,3})[0-9]{5,8}$/;

const convertAndValidatePhoneNumber = (phoneNumber) => {
    return phoneRegex.test(phoneNumber);
};

const generateToken = (type, userId, roomId) => {
    let now = Math.floor(Date.now() / 1000);
    let exp = now + 36000000;
    const header = {
        typ: "JWT",
        cty: "stringee-api;v=1",
        alg: "HS256",
    };
    const payload = {
        jti: process.env.SID_KEY + "-" + now,
        iss: process.env.SID_KEY,
        exp: exp
    };
    switch (type) {
        case "rest":
            payload.rest_api = true;
            break;
        case "room":
            payload.roomId = roomId;
            payload.permissions = {
                publish: true,
                subscribe: true,
                control_room: true,
                record: true
            };
            break;
        case "icc":
            payload.userId = userId;
            payload.icc_api = true;
            break;
        case "noicc":
            payload.userId = userId;
            break;
        default:
            break;
    }
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
        algorithm: "HS256",
        header: header,
        noTimestamp: true,
    });
    return token;
}

module.exports = { convertAndValidatePhoneNumber, generateToken };