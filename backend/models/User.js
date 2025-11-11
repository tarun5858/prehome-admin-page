// import mongoose from "mongoose";
// import jwt from "jsonwebtoken";
// import validator from "validator";

// const UserSchema = new mongoose.Schema({
//     id: {
//         type: String,
//     },
//     name: {
//         type: String,
//         required: true,
//         minlength: 4,
//         maxlength: 50
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         lowercase: true,
//         trim: true,
//         validate(value) {
//             if (!validator.isEmail(value)) {
//                 throw new Error('Invalid Email: ' + value);
//             }
//         }
//     },
//     password: {
//         type: String,
//         validate(value) {
//             if (!validator.isStrongPassword(value)) {
//                 throw new Error('Weak Password');
//             }
//         }
//     },
//     about: {
//         type: String,
//         default: "I am a user of Prehome",
//     },
//     age: {
//         type: Number,
//         min: 18,
//         validate(value) {
//             if (!Number.isInteger(value)) {
//                 throw new Error('Invalid Age');
//             }
//         }
//     },
//     gender: {
//         type: String,
//         validate(value) {
//             if (!['Male', 'Female', 'male', 'female', 'Other'].includes(value)) {
//                 throw new Error('Invalid Gender');
//             }
//         },
//     },
//     photo_url: {
//         type: String,
//         trim: true,
//         validate(value) {
//             if (value && !validator.isURL(value)) {
//                 throw new Error('Invalid Photo URL: ' + value);
//             }
//         },
//     },
//     Skills: {
//         type: [String],
//         default: [],
//     },
// });

// UserSchema.methods.getJWT = async function () {
//     const user = this;
//     const token = jwt.sign({ _id: user._id }, "Prehome@123", { expiresIn: "2d" });
//     return token;
// };

// export default mongoose.model("User", UserSchema);