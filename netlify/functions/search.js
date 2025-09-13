// Minimal test function: proves Netlify sees /functions and CORS works
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify({
      ok: true,
      method: event.httpMethod,
      query: event.queryStringParameters || {},
      body: event.body ? JSON.parse(event.body) : null
    })
  };
};
