/** Request a large, screen-friendly version of a Cloudinary image URL. */
export function cloudinaryFullSizeUrl(url: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  if (/\/upload\/[^/]*(?:w_|c_|q_|f_)/.test(url)) {
    return url;
  }

  return url.replace(
    "/upload/",
    "/upload/c_limit,w_2560,h_2560,q_auto:best,f_auto/"
  );
}
