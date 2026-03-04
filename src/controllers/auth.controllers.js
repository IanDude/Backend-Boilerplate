import { Router } from "express";

const router = Router();

router.get("/check", (req, res) => {
  res.json({ message: "Auth routes??" });
});

export default router;
