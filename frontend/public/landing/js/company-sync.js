(function () {
  function normalizeApiBase(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function resolveApiBase() {
    var fromWindow = normalizeApiBase(window.SQ_API_BASE);
    if (fromWindow) return fromWindow;

    var meta = document.querySelector('meta[name="sq-api-base"]');
    var fromMeta = normalizeApiBase(meta && meta.getAttribute("content"));
    if (fromMeta) return fromMeta;

    var hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000/api";
    }

    return "https://api.sahabatqolbu.com/api";
  }

  var API_ROOT = resolveApiBase();
  var API_BASE = API_ROOT + "/master/company";
  var PUBLIC_AGENT_API_BASE = API_ROOT + "/agents";

  function getAgentSlugFromQuery() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var agent = (params.get("agent") || "").trim();
      return agent || "";
    } catch {
      return "";
    }
  }

  function applyTheme(primary, accent) {
    var main = primary || "#0A2C45";
    var second = accent || "#FFC107";

    function hexToRgb(hex) {
      if (!hex) return null;
      var raw = String(hex).trim().replace(/^#/, "");
      if (raw.length === 3) {
        raw = raw
          .split("")
          .map(function (ch) {
            return ch + ch;
          })
          .join("");
      }
      if (raw.length !== 6 || /[^\da-f]/i.test(raw)) return null;

      return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16),
      };
    }

    var mainRgb = hexToRgb(main);
    var overlayStart = mainRgb
      ? "rgba(" + mainRgb.r + "," + mainRgb.g + "," + mainRgb.b + ",0.9)"
      : "rgba(10,44,69,0.9)";
    var overlayEnd = mainRgb
      ? "rgba(" + mainRgb.r + "," + mainRgb.g + "," + mainRgb.b + ",0.7)"
      : "rgba(10,44,69,0.7)";

    var styleId = "agent-theme-override";
    var existing = document.getElementById(styleId);
    if (existing) existing.remove();

    var style = document.createElement("style");
    style.id = styleId;
    style.textContent =
      ".text-gold{color:" + second + " !important;}" +
      ".gold-gradient{background:" + second + " !important;}" +
      ".bg-gold{background-color:" + second + " !important;}" +
      ".hover\\:bg-gold:hover{background-color:" + second + " !important;}" +
      ".hover\\:text-gold:hover{color:" + second + " !important;}" +
      ".bg-primary{background-color:" + main + " !important;}" +
      ".text-primary{color:" + main + " !important;}" +
      ".border-primary{border-color:" + main + " !important;}" +
      ".text-secondary{color:" + main + " !important;}" +
      ".bg-secondary{background-color:" + main + " !important;}" +
      ".from-primary{--tw-gradient-from:" + main + " var(--tw-gradient-from-position)!important;}" +
      ".to-primary-600{--tw-gradient-to:" + main + " var(--tw-gradient-to-position)!important;}" +
      ".from-secondary{--tw-gradient-from:" + second + " var(--tw-gradient-from-position)!important;}" +
      ".to-secondary-400{--tw-gradient-to:" + second + " var(--tw-gradient-to-position)!important;}" +
      ".gradient-overlay{background:linear-gradient(135deg," + overlayStart + " 0%," + overlayEnd + " 100%) !important;}" +
      "#header.bg-primary{background-color:" + main + " !important;}";
    document.head.appendChild(style);
  }

  function toAbsoluteUrl(path) {
    if (!path) return "";
    var raw = String(path);
    if (raw.indexOf("http://") === 0 || raw.indexOf("https://") === 0) return raw;
    var origin = PUBLIC_AGENT_API_BASE.replace(/\/api(?:\/.*)?$/, "");
    if (raw.charAt(0) === "/") return origin + raw;
    return origin + "/" + raw;
  }

  function applyMitraBrandingIfAgent(agentSlug) {
    if (!agentSlug) return;

    var sahabatNodes = document.querySelectorAll(".js-logo-sahabat");
    sahabatNodes.forEach(function (node) {
      node.textContent = "Mitra Sahabat";
    });

    var qolbuNodes = document.querySelectorAll(".js-logo-qolbu");
    qolbuNodes.forEach(function (node) {
      node.textContent = "Qolbu";
    });

    var agentLandingPath = "/" + encodeURIComponent(agentSlug);
    document.querySelectorAll("a[data-logo-link]").forEach(function (link) {
      link.setAttribute("href", agentLandingPath);
    });
  }

  function setTextBySelector(selector, value) {
    if (!value) return;
    var nodes = document.querySelectorAll(selector);
    nodes.forEach(function (node) {
      node.textContent = value;
    });
  }

  function normalizeWaNumber(raw) {
    if (!raw) return "";
    var digits = String(raw).replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("8")) return "62" + digits;
    return digits;
  }

  function publishLandingContact(contact) {
    window.SQ_LANDING_CONTACT = Object.assign(
      {},
      window.SQ_LANDING_CONTACT || {},
      contact || {}
    );

    document.dispatchEvent(
      new CustomEvent("sq:landing-contact-updated", {
        detail: window.SQ_LANDING_CONTACT,
      })
    );
  }

  function formatPhone(raw) {
    if (!raw) return "";
    return String(raw).trim();
  }

  function setHrefById(id, href) {
    if (!href) return;
    var node = document.getElementById(id);
    if (node) {
      node.setAttribute("href", href);
    }
  }

  function applyJsonLd(data) {
    var script = document.getElementById("company-jsonld");
    if (!script) return;

    try {
      var current = JSON.parse(script.textContent || "{}");
      if (data.companyName) current.name = data.companyName;
      if (data.description) current.description = data.description;
      if (data.email) current.email = data.email;
      if (data.whatsapp) current.telephone = "+" + normalizeWaNumber(data.whatsapp);

      var sameAs = [];
      if (data.instagram) sameAs.push(data.instagram);
      if (data.facebook) sameAs.push(data.facebook);
      if (data.youtube) sameAs.push(data.youtube);
      if (data.tiktok) sameAs.push(data.tiktok);
      if (sameAs.length) current.sameAs = sameAs;

      if (!current.address) current.address = { "@type": "PostalAddress" };
      if (data.address) current.address.streetAddress = data.address;
      if (data.city) current.address.addressLocality = data.city;
      if (data.province) current.address.addressRegion = data.province;
      if (data.postalCode) current.address.postalCode = data.postalCode;

      script.textContent = JSON.stringify(current, null, 2);
    } catch {
      // ignore malformed JSON-LD
    }
  }

  function applyCompanyProfile(data) {
    if (!data) return;

    if (data.tagline) {
      setTextBySelector(".js-company-tagline", data.tagline);
    }

    if (data.description) {
      var desc = document.getElementById("company-description");
      if (desc) desc.textContent = data.description;
    }

    if (data.address || data.city || data.province || data.postalCode) {
      var addressNode = document.getElementById("company-address");
      if (addressNode) {
        var addressParts = [];
        if (data.address) addressParts.push(data.address);
        var cityLine = [data.city, data.province].filter(Boolean).join(", ");
        if (cityLine) addressParts.push(cityLine);
        if (data.postalCode) addressParts.push(data.postalCode);
        addressNode.textContent = addressParts.join(", ");
      }
    }

    if (data.whatsapp) {
      var waNumber = normalizeWaNumber(data.whatsapp);
      var waTextNode = document.getElementById("company-whatsapp-text");
      if (waTextNode) {
        waTextNode.textContent = formatPhone(data.whatsapp);
      }
      if (waNumber) {
        var waHref = "https://wa.me/" + waNumber;
        setHrefById("company-whatsapp-text", waHref);
        publishLandingContact({ whatsapp: waHref, whatsappNumber: waNumber });

        document.querySelectorAll('a[href*="wa.me/"]').forEach(function (link) {
          var oldHref = link.getAttribute("href") || "";
          var queryIndex = oldHref.indexOf("?");
          if (queryIndex >= 0) {
            link.setAttribute("href", waHref + oldHref.substring(queryIndex));
          } else {
            link.setAttribute("href", waHref);
          }
        });
      }
    }

    if (data.email) {
      var emailNode = document.getElementById("company-email-text");
      if (emailNode) {
        emailNode.textContent = data.email;
        emailNode.setAttribute("href", "mailto:" + data.email);
      }
      publishLandingContact({ email: "mailto:" + data.email });
    }

    if (data.companyName) {
      var year = new Date().getFullYear();
      var copyrightNode = document.getElementById("company-copyright");
      if (copyrightNode) {
        copyrightNode.textContent = "© " + year + " " + data.companyName + ". All rights reserved.";
      }
    }

    if (data.instagram) {
      document
        .querySelectorAll('a[aria-label="Instagram Sahabat Qolbu"]')
        .forEach(function (a) {
          a.setAttribute("href", data.instagram);
        });
    }
    if (data.facebook) {
      document
        .querySelectorAll('a[aria-label="Facebook Sahabat Qolbu"]')
        .forEach(function (a) {
          a.setAttribute("href", data.facebook);
        });
    }

    applyJsonLd(data);
  }

  function applyAgentLinks(payload) {
    if (!payload) return;

    var cta = payload.cta || {};
    var socials = payload.socials || {};
    var agent = payload.agent || {};

    if (agent.landingLogo) {
      var logoUrl = toAbsoluteUrl(agent.landingLogo);
      document.querySelectorAll('img[alt="Logo Sahabat Qolbu"]').forEach(function (img) {
        img.setAttribute("src", logoUrl);
        img.setAttribute("alt", "Logo Mitra Agen");
      });
    }

    applyTheme(agent.landingPrimaryColor, agent.landingAccentColor);

    if (cta.whatsapp) {
      var waNumber = normalizeWaNumber(cta.whatsapp);
      var waHref = waNumber ? "https://wa.me/" + waNumber : cta.whatsapp;
      var waTextNode = document.getElementById("company-whatsapp-text");
      if (waTextNode) {
        waTextNode.textContent = waNumber ? "+" + waNumber : waHref;
      }
      publishLandingContact({ whatsapp: waHref, whatsappNumber: waNumber });

      document.querySelectorAll('a[href*="wa.me/"]').forEach(function (link) {
        var oldHref = link.getAttribute("href") || "";
        var queryIndex = oldHref.indexOf("?");
        if (queryIndex >= 0) {
          link.setAttribute("href", waHref + oldHref.substring(queryIndex));
        } else {
          link.setAttribute("href", waHref);
        }
      });
    }

    if (cta.email) {
      var emailNode = document.getElementById("company-email-text");
      if (emailNode) {
        var email = cta.email.replace(/^mailto:/, "");
        emailNode.textContent = email;
        emailNode.setAttribute("href", cta.email);
      }
      publishLandingContact({ email: cta.email });
    }

    function normalizeSocial(urlOrHandle, base) {
      if (!urlOrHandle) return null;
      var val = String(urlOrHandle).trim();
      if (!val) return null;
      if (val.indexOf("http://") === 0 || val.indexOf("https://") === 0) return val;
      if (val.indexOf("@") === 0) val = val.slice(1);
      return base + val;
    }

    var instagramUrl = normalizeSocial(socials.instagram, "https://instagram.com/");
    var facebookUrl = normalizeSocial(socials.facebook, "https://facebook.com/");
    var youtubeUrl = normalizeSocial(socials.youtube, "https://youtube.com/@");
    var tiktokUrl = normalizeSocial(socials.tiktok, "https://tiktok.com/@");

    if (instagramUrl) {
      document
        .querySelectorAll('a[aria-label="Instagram Sahabat Qolbu"]')
        .forEach(function (a) {
          a.setAttribute("href", instagramUrl);
        });
    }

    if (facebookUrl) {
      document
        .querySelectorAll('a[aria-label="Facebook Sahabat Qolbu"]')
        .forEach(function (a) {
          a.setAttribute("href", facebookUrl);
        });
    }

    if (youtubeUrl) {
      document.querySelectorAll('a[href*="youtube.com"]').forEach(function (a) {
        a.setAttribute("href", youtubeUrl);
      });
    }

    if (tiktokUrl) {
      document.querySelectorAll('a[href*="tiktok.com"]').forEach(function (a) {
        a.setAttribute("href", tiktokUrl);
      });
    }
  }

  var agentSlug = getAgentSlugFromQuery();

  applyMitraBrandingIfAgent(agentSlug);

  function fetchJson(url, options) {
    return fetch(url, options)
      .then(function (res) {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .catch(function () {
        return null;
      });
  }

  var companyProfileRequest = fetchJson(API_BASE, { credentials: "include" });
  var agentProfileRequest = agentSlug
    ? fetchJson(PUBLIC_AGENT_API_BASE + "/" + encodeURIComponent(agentSlug))
    : Promise.resolve(null);

  Promise.all([companyProfileRequest, agentProfileRequest])
    .then(function (results) {
      var companyPayload = results[0];
      var agentPayload = results[1];

      applyCompanyProfile(
        companyPayload && companyPayload.data ? companyPayload.data : null
      );

      if (agentSlug) {
        applyMitraBrandingIfAgent(agentSlug);
        applyAgentLinks(agentPayload && agentPayload.data ? agentPayload.data : null);
      }
    })
    .catch(function () {
      // keep static fallback content if API unavailable
    });
})();
