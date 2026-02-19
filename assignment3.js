(() => {
  // ========= Data path =========
  const DATA_URL = "dataset/videogames_wide.csv";

  // Company grouping expression (Vega expression language)
  const COMPANY_EXPR =
    "indexof(['PS','PS2','PS3','PS4','PSP','PSV'], datum.Platform) >= 0 ? 'Sony' :" +
    "indexof(['NES','SNES','N64','GC','Wii','WiiU','GB','GBA','DS','3DS'], datum.Platform) >= 0 ? 'Nintendo' :" +
    "indexof(['XB','X360','XOne'], datum.Platform) >= 0 ? 'Microsoft' :" +
    "'Other'";

  // ========= Theme-aware Vega config =========
  const getThemeConfig = () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    return {
      background: null,
      axis: {
        labelColor: isLight ? "#566079" : "#a7b0c0",
        titleColor: isLight ? "#111522" : "#e7eaf0",
        gridColor: isLight ? "rgba(17,21,34,0.12)" : "rgba(255,255,255,0.08)",
        domainColor: isLight ? "rgba(17,21,34,0.18)" : "rgba(255,255,255,0.14)",
        tickColor: isLight ? "rgba(17,21,34,0.18)" : "rgba(255,255,255,0.14)"
      },
      legend: {
        labelColor: isLight ? "#566079" : "#a7b0c0",
        titleColor: isLight ? "#111522" : "#e7eaf0"
      },
      title: {
        color: isLight ? "#111522" : "#e7eaf0",
        fontSize: 14
      }
    };
  };

  // ========= Embed helper =========
  const embed = async (mountId, spec) => {
    const el = document.getElementById(mountId);
    if (!el) return;

    el.innerHTML = "";

    try {
      await vegaEmbed(el, spec, {
        actions: false,
        renderer: "svg",
        defaultStyle: true
      });
    } catch (err) {
      el.innerHTML =
        `<p style="color:#ff6b6b;margin:0">
          Chart failed to load. Check <code>${DATA_URL}</code> path and use Live Server / GitHub Pages.
        </p>`;
      console.error(err);
    }
  };

  // Responsive sizing
  const AUTO = { type: "fit", contains: "padding" };

  // ========= Specs =========

  // V1) Global Sales by Genre and Platform (stacked, top 10 platforms)
  const specV1 = () => ({
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 360,
    autosize: AUTO,
    data: { url: DATA_URL, format: { type: "csv" } },
    transform: [
      {
        aggregate: [{ op: "sum", field: "Global_Sales", as: "global_sales" }],
        groupby: ["Genre", "Platform"]
      },
      {
        joinaggregate: [{ op: "sum", field: "global_sales", as: "platform_total" }],
        groupby: ["Platform"]
      },
      {
        window: [{ op: "rank", as: "platform_rank" }],
        sort: [{ field: "platform_total", order: "descending" }]
      },
      { filter: "datum.platform_rank <= 10" },
      {
        joinaggregate: [{ op: "sum", field: "global_sales", as: "genre_total" }],
        groupby: ["Genre"]
      }
    ],
    mark: "bar",
    encoding: {
      x: {
        field: "Genre",
        type: "nominal",
        sort: { field: "genre_total", order: "descending" },
        axis: { title: "Genre", labelAngle: -25 }
      },
      y: {
        field: "global_sales",
        type: "quantitative",
        axis: { title: "Total Global Sales (Millions)" }
      },
      color: { field: "Platform", type: "nominal", legend: { title: "Platform (Top 10)" } },
      tooltip: [
        { field: "Genre", type: "nominal" },
        { field: "Platform", type: "nominal" },
        { field: "global_sales", type: "quantitative", title: "Global Sales (M)", format: ".2f" }
      ]
    },
    config: getThemeConfig()
  });

  // V2) PSP Action sales over time (line)
  const specV2 = () => ({
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 320,
    autosize: AUTO,
    data: { url: DATA_URL, format: { type: "csv" } },
    transform: [
      { filter: "datum.Platform === 'PSP' && datum.Genre === 'Action'" },
      { filter: "isValid(datum.Year) && datum.Year != null" },
      {
        aggregate: [{ op: "sum", field: "Global_Sales", as: "global_sales" }],
        groupby: ["Year"]
      }
    ],
    mark: { type: "line", point: true },
    encoding: {
      x: { field: "Year", type: "ordinal", sort: "ascending", axis: { title: "Year" } },
      y: { field: "global_sales", type: "quantitative", axis: { title: "Total Global Sales (M)" } },
      tooltip: [
        { field: "Year", type: "ordinal" },
        { field: "global_sales", type: "quantitative", title: "Sales (M)", format: ".2f" }
      ]
    },
    config: getThemeConfig()
  });

  // V3) Pie/Donut WITHOUT text labels (legend + tooltip only)
  const specV3 = () => ({
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 320,
    autosize: AUTO,
    data: { url: DATA_URL, format: { type: "csv" } },
    transform: [
      { filter: "datum.Platform === 'PSP' && datum.Genre === 'Action'" },
      { fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"], as: ["region", "sales"] },
      {
        calculate:
          "datum.region === 'NA_Sales' ? 'North America' :" +
          "datum.region === 'EU_Sales' ? 'Europe' :" +
          "datum.region === 'JP_Sales' ? 'Japan' :" +
          "'Other'",
        as: "region_label"
      },
      { calculate: "toNumber(datum.sales)", as: "sales_num" },
      { aggregate: [{ op: "sum", field: "sales_num", as: "region_sales" }], groupby: ["region_label"] },
      { joinaggregate: [{ op: "sum", field: "region_sales", as: "total_all" }] },
      { calculate: "datum.region_sales / datum.total_all", as: "pct" }
    ],
    mark: { type: "arc", innerRadius: 55 },
    encoding: {
      theta: { field: "region_sales", type: "quantitative" },
      color: { field: "region_label", type: "nominal", legend: { title: "Region" } },
      tooltip: [
        { field: "region_label", type: "nominal", title: "Region" },
        { field: "region_sales", type: "quantitative", title: "Sales (M)", format: ".2f" },
        { field: "pct", type: "quantitative", title: "Share", format: ".1%" }
      ]
    },
    config: getThemeConfig()
  });

  // V4) Company dominance in Action games (bar) 
  const specV4 = () => ({
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 300,
    autosize: AUTO,
    data: { url: DATA_URL, format: { type: "csv" } },
    transform: [
      { filter: "datum.Genre === 'Action'" },
      { calculate: COMPANY_EXPR, as: "company_group" },
      { calculate: "toNumber(datum.Global_Sales)", as: "sales_num" }
    ],
    mark: "bar",
    encoding: {
      x: { field: "company_group", type: "nominal", sort: "-y", axis: { title: "Company" } },
      y: {
        aggregate: "sum",
        field: "sales_num",
        type: "quantitative",
        axis: { title: "Total Action Game Global Sales (M)" }
      },
      color: { field: "company_group", type: "nominal", legend: null },
      tooltip: [
        { field: "company_group", type: "nominal", title: "Company" },
        { aggregate: "sum", field: "sales_num", type: "quantitative", title: "Sales (M)", format: ".2f" }
      ]
    },
    config: getThemeConfig()
  });

  // Follow-up 1) Avg sales per game by Genre × Platform (top 10 platforms)
  const specF1 = () => ({
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 360,
    autosize: AUTO,
    data: { url: DATA_URL, format: { type: "csv" } },
    transform: [
      { joinaggregate: [{ op: "sum", field: "Global_Sales", as: "platform_total" }], groupby: ["Platform"] },
      { window: [{ op: "rank", as: "platform_rank" }], sort: [{ field: "platform_total", order: "descending" }] },
      { filter: "datum.platform_rank <= 10" },
      { aggregate: [{ op: "mean", field: "Global_Sales", as: "avg_sales" }], groupby: ["Genre", "Platform"] }
    ],
    mark: "bar",
    encoding: {
      x: { field: "Genre", type: "nominal", axis: { title: "Genre", labelAngle: -25 } },
      y: { field: "avg_sales", type: "quantitative", axis: { title: "Avg Sales per Game (M)" } },
      color: { field: "Platform", type: "nominal", legend: { title: "Platform (Top 10)" } },
      tooltip: [
        { field: "Genre", type: "nominal" },
        { field: "Platform", type: "nominal" },
        { field: "avg_sales", type: "quantitative", title: "Avg Sales (M)", format: ".2f" }
      ]
    },
    config: getThemeConfig()
  });

  // Follow-up 2) PSP Action: sales vs release count per year (two y-axes)
  const specF2 = () => ({
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 320,
    autosize: AUTO,
    data: { url: DATA_URL, format: { type: "csv" } },
    transform: [
      { filter: "datum.Platform === 'PSP' && datum.Genre === 'Action'" },
      { filter: "isValid(datum.Year) && datum.Year != null" },
      {
        aggregate: [
          { op: "sum", field: "Global_Sales", as: "total_sales" },
          { op: "count", as: "release_count" }
        ],
        groupby: ["Year"]
      }
    ],
    layer: [
      {
        mark: { type: "line", point: true },
        encoding: {
          x: { field: "Year", type: "ordinal", sort: "ascending", axis: { title: "Year" } },
          y: { field: "total_sales", type: "quantitative", axis: { title: "Total Sales (M)" } },
          tooltip: [
            { field: "Year", type: "ordinal" },
            { field: "total_sales", type: "quantitative", title: "Sales (M)", format: ".2f" },
            { field: "release_count", type: "quantitative", title: "Releases" }
          ]
        }
      },
      {
        mark: { type: "line", point: true },
        encoding: {
          x: { field: "Year", type: "ordinal" },
          y: { field: "release_count", type: "quantitative", axis: { title: "Releases" } }
        }
      }
    ],
    resolve: { scale: { y: "independent" } },
    config: getThemeConfig()
  });

  // Follow-up 3) PSP regional share by genre (100% stacked)
  const specF3 = () => ({
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 360,
    autosize: AUTO,
    data: { url: DATA_URL, format: { type: "csv" } },
    transform: [
      { filter: "datum.Platform === 'PSP'" },
      { fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"], as: ["region", "sales"] },
      {
        calculate:
          "datum.region === 'NA_Sales' ? 'North America' :" +
          "datum.region === 'EU_Sales' ? 'Europe' :" +
          "datum.region === 'JP_Sales' ? 'Japan' :" +
          "'Other'",
        as: "region_label"
      },
      { calculate: "toNumber(datum.sales)", as: "sales_num" },
      { aggregate: [{ op: "sum", field: "sales_num", as: "region_sales" }], groupby: ["Genre", "region_label"] }
    ],
    mark: "bar",
    encoding: {
      x: { field: "Genre", type: "nominal", axis: { title: "Genre", labelAngle: -25 } },
      y: { field: "region_sales", type: "quantitative", stack: "normalize", axis: { title: "Proportion of PSP Sales" } },
      color: { field: "region_label", type: "nominal", legend: { title: "Region" } },
      tooltip: [
        { field: "Genre", type: "nominal" },
        { field: "region_label", type: "nominal" },
        { field: "region_sales", type: "quantitative", title: "Sales (M)", format: ".2f" }
      ]
    },
    config: getThemeConfig()
  });

  // Follow-up 4) Company sales across genres
  const specF4 = () => ({
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: "container",
    height: 380,
    autosize: AUTO,
    data: { url: DATA_URL, format: { type: "csv" } },
    transform: [
      { calculate: COMPANY_EXPR, as: "company_group" },
      { calculate: "toNumber(datum.Global_Sales)", as: "sales_num" },
      { aggregate: [{ op: "sum", field: "sales_num", as: "total_sales" }], groupby: ["Genre", "company_group"] }
    ],
    mark: "bar",
    encoding: {
      x: { field: "Genre", type: "nominal", axis: { title: "Genre", labelAngle: -25 } },
      y: { field: "total_sales", type: "quantitative", axis: { title: "Total Global Sales (M)" } },
      color: { field: "company_group", type: "nominal", legend: { title: "Company" } },
      tooltip: [
        { field: "Genre", type: "nominal" },
        { field: "company_group", type: "nominal" },
        { field: "total_sales", type: "quantitative", title: "Sales (M)", format: ".2f" }
      ]
    },
    config: getThemeConfig()
  });

  // ========= Render all charts =========
  const renderAll = async () => {
    await embed("vl_v1", specV1());
    await embed("vl_v2", specV2());
    await embed("vl_v3", specV3());
    await embed("vl_v4", specV4());
    await embed("vl_f1", specF1());
    await embed("vl_f2", specF2());
    await embed("vl_f3", specF3());
    await embed("vl_f4", specF4());
  };

  renderAll();

  // Re-render on theme toggle for readability
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      renderAll();
    });
  }
})();
