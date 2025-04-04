export const http = async ({
  path,
  method,
  headers,
  body,
}: {
  path: string;
  method: RequestInit["method"];
  headers?: RequestInit["headers"];
  body?: object;
}) => {
  try {
    return await fetch(`http://localhost:3000/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });
  } catch (error) {
    console.log(error);
  }
};
