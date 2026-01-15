class ApiResponse {
    constructor(data = null, message = 'Success', statusCode = 200, meta = {}) {
        this.success = true;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.meta = meta;
        this.timestamp = new Date().toISOString();
    }
    
    // Factory methods for common responses
    static success(data, message = 'Operation successful', meta = {}) {
        return new ApiResponse(data, message, 200, meta);
    }
    
    static created(data, message = 'Resource created successfully', meta = {}) {
        return new ApiResponse(data, message, 201, meta);
    }
    
    static accepted(data, message = 'Request accepted', meta = {}) {
        return new ApiResponse(data, message, 202, meta);
    }
    
    static noContent(message = 'No content', meta = {}) {
        return new ApiResponse(null, message, 204, meta);
    }
    
    static paginated(data, pagination, message = 'Data fetched successfully') {
        return new ApiResponse(data, message, 200, { pagination });
    }
    
    // For empty responses with metadata
    static empty(message = 'No data found', meta = {}) {
        return new ApiResponse(null, message, 200, meta);
    }
    
    // Convert to JSON
    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
            meta: this.meta,
            timestamp: this.timestamp
        };
    }
    
    // Send response through Express res object
    send(res) {
        return res.status(this.statusCode).json(this.toJSON());
    }
}

export default ApiResponse;

//Ye consistent API response format provide karta hai. 
// Har response mein success, message, data, aur timestamp automatically include hota hai. 
// Pagination aur metadata support hai.