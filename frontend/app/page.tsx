export default function RootPage() {
  return (
    <html lang="es">
      <head>
        <meta httpEquiv="refresh" content="0; url=/es/" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if (typeof window !== "undefined") { window.location.href = "/es/"; }`,
          }}
        />
      </head>
      <body>
        <p className="p-4 text-xs text-slate-400">
          Redirecting to <a href="/es/" className="underline">/es/</a>...
        </p>
      </body>
    </html>
  );
}
