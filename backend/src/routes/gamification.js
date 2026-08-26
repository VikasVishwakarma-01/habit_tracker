import express from "express"; import { db, xpTransactions } from "../db.js"; import { requireAuth } from "../middleware/auth.js"; import { getGamification } from "../services/gamification.js";
const router=express.Router();router.use(requireAuth);
router.get("/",async(req,res)=>res.json(await getGamification(req.userId)));
router.get("/history",async(req,res)=>res.json(await xpTransactions.find({user_id:req.userId}).sort({created_at:-1}).limit(50).toArray()));
export default router;
