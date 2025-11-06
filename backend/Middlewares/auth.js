
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authUser = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).send("Please Login!");
    }

    try {
        const decodeObj = await jwt.verify(token, "Prehome@123");
        const _id = decodeObj._id;

        const user = await User.findById(_id); // added await here too
        if (!user) {
            return res.status(404).send("User not found");
        }

        req.user = user; // attach full user object to request
        next();
    } catch (e) {
        console.log(e);
        res.status(401).send("Unauthorized");
    }
};


// module.exports = authUser;