const columns = [
  {
    heading: "EXPLORE",
    links: ["About JMC", "Sign In", "Create Account", "Donate"],
  },
  {
    heading: "LEGAL",
    links: ["Terms", "Privacy", "Contact"],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12 sm:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 text-left sm:grid-cols-3 sm:justify-items-center sm:text-center">
        <div className="col-span-2 sm:col-span-1">
          <h3 className="text-sm font-bold text-foreground">Luma</h3>
          <address className="mt-2 space-y-0.5 text-sm not-italic text-muted-foreground">
            <p>Ismaili Center</p>
            <p>2323 Allen Parkway</p>
            <p>Houston, TX 77019</p>
          </address>
        </div>
        {columns.map((column) => (
          <div key={column.heading}>
            <h3 className="text-sm font-bold text-foreground">{column.heading}</h3>
            <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#" className="transition-colors hover:text-foreground">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-border px-6 pt-6 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Jubilee Monuments Corp. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
