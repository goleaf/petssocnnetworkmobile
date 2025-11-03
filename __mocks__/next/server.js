// Manual mock for next/server
// This mock provides NextResponse for testing Next.js API routes

class NextResponse extends Response {
  constructor(body, init) {
    const jsonBody = typeof body === 'string' ? body : JSON.stringify(body)
    super(jsonBody, {
      status: init?.status || 200,
      statusText: init?.statusText || 'OK',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      ...init,
    })
    
    this._body = body
  }
  
  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body)
    }
    return this._body
  }
  
  static json(data, init) {
    return new NextResponse(data, init)
  }
}

// Create an object that has NextResponse as a property
// and also supports default export pattern
const mockModule = {
  NextResponse,
}

// Add default property that points to an object with json static method
mockModule.default = NextResponse

// Support both CommonJS named and default exports
module.exports = mockModule
module.exports.NextResponse = NextResponse
module.exports.default = NextResponse

