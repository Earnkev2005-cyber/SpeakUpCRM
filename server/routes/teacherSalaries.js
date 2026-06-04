const router = require("express").Router();
const c = require("../controllers/teacherSalaryController");

router.get("/", c.getAll);
router.post("/", c.create);
router.put("/:id", c.update);
router.patch("/:id/pay", c.markPaid);
router.delete("/:id", c.remove);

module.exports = router;
