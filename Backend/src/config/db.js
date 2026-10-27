
import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI environment variable is missing");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log("MongoDB connected successfully");

        return mongoose.connection;
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        throw err;
    }
};




// import mongoose from "mongoose"
// import dns from "dns"


// dns.setServers(["1.1.1.1"]);

// export const connectDB = async () => {
//     try{
//         await mongoose.connect(process.env.MONGO_URI)
//         console.log(`MongoDb connected`);
//     } catch (err) {
//         console.log(err.message);
//     }
// }