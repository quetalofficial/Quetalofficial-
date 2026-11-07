const SUPABASE_URL = "https://qdywqohcgirlavjyuurw.supabase.co";
const SITE_URL = "https://quetal.company";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

exports.handler = async (event) => {
  const id = event.queryStringParameters?.id || "";

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { statusCode: 302, headers: { Location: SITE_URL } };
  }

  const destination = SITE_URL + "/#video-" + id;
  let title = "Watch this video on Qué tal";
  let description = "Watch, share and discover videos on Qué tal.";
  let image = "";

  try {
    const url = SUPABASE_URL +
      "/rest/v1/video_posts?id=eq." + encodeURIComponent(id) +
      "&select=*";
    const response = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY || "",
        Authorization: "Bearer " + (process.env.SUPABASE_ANON_KEY || "")
      }
    });

    if (response.ok) {
      const posts = await response.json();
      const post = posts[0];
      if (post) {
        title = String(post.caption || post.title || title).slice(0, 120);
        const candidate = post.thumbnail_url || post.poster_url || post.image_url || "";
        if (/^https:\/\//i.test(candidate)) image = candidate;
      }
    }
  } catch (error) {
    console.log("Preview lookup unavailable");
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} | Qué tal</title>
<meta property="og:type" content="video.other">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(SITE_URL + "/video-preview?id=" + id)}">
${image ? '<meta property="og:image" content="' + escapeHtml(image) + '">' : ""}
<meta name="twitter:card" content="summary_large_image">
${image ? '<meta name="twitter:image" content="' + escapeHtml(image) + '">' : ""}
<meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}">
</head>
<body>
<p>Opening video on Qué tal...</p>
<a href="${escapeHtml(destination)}">Watch video</a>
<script>location.replace(${JSON.stringify(destination)})</script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" },
    body: html
  };
};
