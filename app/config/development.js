/*
    App > Config > Development

    Dev-mode-only configurations
*/

module.exports = {
  db_url: process.env.TEST_DB ? "mongodb://mongo/path_test" : "mongodb://mongo/path_dev"
}
