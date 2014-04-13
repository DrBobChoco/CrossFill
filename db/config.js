module.exports.getDBURL = function() {
	var connectionString =  "mongodb://localhost:27017/crossFiller";
	if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
		connectionString = "mongodb://" + process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
		process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
		process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
		process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
		process.env.OPENSHIFT_APP_NAME;
	}
	return connectionString;
}
