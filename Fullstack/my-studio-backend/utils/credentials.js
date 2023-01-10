module.exports.db_config = {
  host: process.env.AWS_DB_HOST,
  user: process.env.AWS_DB_USERNAME,
  password: process.env.AWS_DB_PASSWORD,
  database: process.env.AWS_DB_NAME,
  port: process.env.AWS_DB_PORT,
};

module.exports.firebase_confg = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

module.exports.stripe_key = process.env.STRIPE_PRIVATE_KEY;

module.exports.aws_config = {
  accessKeyId: process.env.AWS_CONFIG_ACCESSKEYID,
  secretAccessKey: process.env.AWS_CONFIG_SECRETACCESSKEY,
  region: process.env.AWS_CONFIG_REGION,
};

module.exports.zoom_setting = {
  tokenUrl: process.env.ZOOM_OAUTH_TOKEN_URL,
  clientId: process.env.ZOOM_OAUTH_CLIENT_ID,
  clientSecret: process.env.ZOOM_OAUTH_CLIENT_SECRET,
  redirectUri: process.env.ZOOM_OAUTH_REDIRECT_URI,
};
