/**
 * disableGlobalAutocomplete.js  (v2 — Chrome password-manager fix)
 * ----------------------------------------------------------------
 * WHY v1 DIDN'T STOP PASSWORD-MANAGER SUGGESTIONS:
 * Chrome's saved-password/login autofill is a completely separate
 * subsystem from regular form autocomplete. It IGNORES
 * autocomplete="off" entirely for fields it heuristically detects
 * as "username" or "password" type fields — this has been Chrome's
 * intentional behavior since ~2014 (they decided autocomplete="off"
 * should not be able to disable password manager, for user-security
 * reasons — users should be able to save passwords even if a site
 * tries to block it).
 *
 * THE ONLY THINGS THAT ACTUALLY WORK ON CHROME FOR THIS:
 *
 *  1. For password fields: use autocomplete="new-password" instead
 *     of "off". Chrome treats "new-password" as "this is a field for
 *     CREATING a new password, not logging in with a saved one" —
 *     so it stops suggesting saved credentials (though it may still
 *     offer to GENERATE a new strong password, which is usually fine
 *     for an ERP since that's not a "previous suggestion" leak).
 *
 *  2. For username/email-like fields paired with a password field:
 *     Chrome links the two by being inside the same <form> and being
 *     adjacent. Renaming the field so it doesn't look like
 *     "username", "email", "user", "login" helps, but Chrome also
 *     inspects type/label/placeholder, not just name.
 *
 *  3. Most reliable technique (used by many internal admin tools):
 *     set autocomplete="off" AND also `readonly` on the field at
 *     mount time, then remove `readonly` on focus. Chrome's autofill
 *     engine snapshots field eligibility at initial render — if the
 *     field is readonly when the page loads, Chrome skips it for
 *     autofill entirely. Removing readonly on focus does not
 *     re-trigger Chrome's autofill scan. This is applied below for
 *     ANY field Chrome might treat as a login field (type="password"
 *     or fields whose name/id/placeholder/autocomplete hints at
 *     user/login/email).
 *
 * This version keeps v1's logic for normal fields and adds the
 * readonly-until-focus technique specifically for password-manager-
 * targeted fields.
 * ----------------------------------------------------------------
 */

let uidCounter = 0;
let observer = null;

const FIELD_SELECTOR = "input, select, textarea";

// Heuristics Chrome itself uses to decide "this looks like a login field" —
// we check the same signals so we know which fields need the stronger fix.
const LOGIN_LIKE_PATTERN = /user|login|email|signin|sign-in|password|pwd|pass/i;

const looksLoginRelated = (el) => {
  const type = (el.type || "").toLowerCase();
  if (type === "password") return true;

  const haystack = [
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute("aria-label"),
    el.autocomplete,
  ]
    .filter(Boolean)
    .join(" ");

  return LOGIN_LIKE_PATTERN.test(haystack);
};

const patchField = (el) => {
  if (!el || el.dataset.acPatched === "1") return;

  const tag = el.tagName.toLowerCase();

  if (tag === "input") {
    const type = (el.type || "text").toLowerCase();
    const skipTypes = ["file", "checkbox", "radio", "hidden", "button", "submit", "image"];
    if (skipTypes.includes(type)) return;
  }

  const isLoginLike = looksLoginRelated(el);

  if (isLoginLike && el.type === "password") {
    // Chrome honors this specific value to mean "don't suggest saved
    // passwords here" much more reliably than autocomplete="off".
    el.setAttribute("autocomplete", "new-password");
  } else {
    el.setAttribute("autocomplete", "off");
  }

  el.setAttribute("data-lpignore", "true");
  el.setAttribute("data-form-type", "other");

  const existingName = el.getAttribute("name");
  const randomSuffix = `${Date.now().toString(36)}-${(uidCounter += 1)}`;
  el.setAttribute("name", existingName ? `${existingName}__${randomSuffix}` : `f-${randomSuffix}`);

  // ── Readonly-until-focus trick for anything Chrome's autofill engine
  // targets (password fields, or username/email fields next to one). ──
  if (isLoginLike) {
    // Snapshot: Chrome's autofill scan runs at load/render time and skips
    // fields that are readonly at that moment.
    el.setAttribute("readonly", "readonly");

    const enableOnFocus = () => {
      el.removeAttribute("readonly");
    };
    const restoreOnBlurIfEmpty = () => {
      // Optional: re-arm readonly if user clicks away without typing,
      // so a later re-focus doesn't accidentally trigger a fresh
      // autofill scan in some Chrome versions. Safe no-op if filled.
      if (!el.value) {
        el.setAttribute("readonly", "readonly");
      }
    };

    el.addEventListener("focus", enableOnFocus, { once: false });
    el.addEventListener("mousedown", enableOnFocus, { once: false }); // covers click-to-focus before native focus fires
    el.addEventListener("blur", restoreOnBlurIfEmpty);
  }

  el.dataset.acPatched = "1";
};

const patchAllExisting = () => {
  document.querySelectorAll(FIELD_SELECTOR).forEach(patchField);
};

export const startGlobalAutocompleteGuard = () => {
  patchAllExisting();

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;

        if (node.matches?.(FIELD_SELECTOR)) {
          patchField(node);
        }
        node.querySelectorAll?.(FIELD_SELECTOR).forEach(patchField);
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer?.disconnect();
    observer = null;
  };
};