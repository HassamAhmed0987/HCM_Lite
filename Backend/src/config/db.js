import mongoose from "mongoose"
import dns from "dns"


dns.setServers(["1.1.1.1"]);

export const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDb connected`);
    } catch (err) {
        console.log(err.message);
    }
}