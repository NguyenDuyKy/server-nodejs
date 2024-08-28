const router = require("express").Router();
const controller = require("./controller");

router.post("/get-list", controller.getList);
router.get("/answer-url", controller.answerUrl);
router.get("/get-customer-info", controller.getCustomerInfo);
router.post("/on-fail-url", controller.onFailUrl);
router.get("/client-token", controller.generateClientToken);
router.get("/rest-token", controller.generateRestToken);
router.get("/room-token", controller.generateRoomToken)

module.exports = router;
