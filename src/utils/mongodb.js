const mongoose = require("mongoose");
const { MONGO_DB_API } = require('../configs/env'); 


class MongoDB {
    static async connect() {


        try {
            await mongoose.connect(MONGO_DB_API);
            console.log("MongoDB has connected");
        } catch (error) {
            console.error("MongoDB Connection Error:", error);
        }
    }
}

module.exports = MongoDB;