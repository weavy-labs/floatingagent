// This is a template file that will be used by the background script
const script = document.createElement('script');
script.src = '{{WEAVY_URL}}/uikit-web/weavy.js';

script.onload = () => {
  const weavy = new Weavy({
    url: "{{WEAVY_URL}}",
    tokenFactory: async () => {
      try {
        const response = await fetch("{{TOKEN_ENDPOINT}}", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({{USER_DATA}})
        });

        if (!response.ok) {
          throw new Error("Failed to get token");
        }

        const data = await response.json();
        return data.access_token;
      } catch (error) {
        console.error("Token error:", error);
        throw error;
      }
    }
  });

  weavy.createMessenger({
    container: "{{CONTAINER_ID}}"
  });
};

script.onerror = () => {
  console.error('Failed to load Weavy script');
};

document.head.appendChild(script); 