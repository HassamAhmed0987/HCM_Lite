import mongoose from "mongoose";

let connectionPromise;

export const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI environment variable is missing");
    }

    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
    })
        .then(() => {
            console.log("MongoDB connected successfully");
            return mongoose.connection;
        })
        .catch((err) => {
            console.error("MongoDB connection failed:", {
                name: err.name,
                code: err.code,
                message: err.message,
            });
            throw err;
        })
        .finally(() => {
            connectionPromise = undefined;
        });

    return connectionPromise;
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
