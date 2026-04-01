import mongoose from 'mongoose'

const MAX_RETRIES = 3
const RETRY_DELAY = 3000

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const connectDB = async (retries = MAX_RETRIES) => {
  try {
    const uri = process.env.MONGODB_URL

    if (!uri) {
      throw new Error('MONGODB_URL is not defined in .env file')
    }

    mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'))
    mongoose.connection.on('disconnected', () => console.log('❌ MongoDB disconnected'))
    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err))

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    })
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`)

    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`)
      await wait(RETRY_DELAY)
      return connectDB(retries - 1)
    }

    console.error('All retries failed. Exiting...')
    process.exit(1)
  }
}
