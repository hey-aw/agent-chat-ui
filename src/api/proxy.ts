export async function POST(request: Request) {
    const { apiUrl, path, method, body } = await request.json();

    try {
        const response = await fetch(`${apiUrl}${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": process.env.LANGSMITH_API_KEY ?? "",
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return new Response(JSON.stringify({ error: "Failed to proxy request" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
} 