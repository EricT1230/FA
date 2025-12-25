const http = require('http')

const healthCheck = () => {
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 4000,
    path: '/health',
    timeout: 2000
  }

  const request = http.request(options, (response) => {
    if (response.statusCode === 200) {
      console.log('Auth service health check passed')
      process.exit(0)
    } else {
      console.error(`Auth service health check failed with status: ${response.statusCode}`)
      process.exit(1)
    }
  })

  request.on('error', (error) => {
    console.error('Auth service health check failed:', error.message)
    process.exit(1)
  })

  request.on('timeout', () => {
    console.error('Auth service health check timed out')
    request.destroy()
    process.exit(1)
  })

  request.end()
}

healthCheck()