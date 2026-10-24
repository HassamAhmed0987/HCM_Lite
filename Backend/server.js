import express from "express";
import app from "./app.js";
import { connectDB } from "./src/config/db.js";
import { initAdmin } from "./src/utils/bootstrap.js"; // Bootstrap script import ki
import { configDotenv } from "dotenv";

configDotenv();

const PORT = process.env.PORT || 3001; // .env se port uthaye ga, warna 3001

const startServer = async () => {
    try {
        // 1. Sab se pehle Database connect ho ga
        await connectDB();
        
        // 2. Phir Bootstrap run ho ga (Admin check/creation)
        await initAdmin();

        // 3. Last mein Express server listen kare ga
        app.listen(PORT, () => {
            console.log(`🚀 Server listening at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
    }
};

startServer();


// import express from "express";
// import app from "./app.js";
// import { connectDB } from "./src/config/db.js";
// import { configDotenv } from "dotenv";


// configDotenv()
// const PORT = 3001





// connectDB()



// app.listen(PORT, () => {
//     console.log(`Server listen at http://localhost:${PORT}`);
// })







