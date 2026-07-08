"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Allergen, Ingredient, Product } from "@/lib/types";
import { prettyDate } from "@/lib/dates";

interface RecipeRow { ingredientId: number; amount: number }
interface VariantRow { id?: number; label: string; price: number; stockLimit: number | null; recipe: RecipeRow[] }
interface ImageRow { id: number; url: string }
interface DayRow { day: string; available: boolean }

const CATEGORIES = ["Croissants", "Brownies", "Cakes", "Tarts", "Cookies", "Pastries", "Mixed Boxes", "Celebration Boxes", "Other"];

export default function ProductEditor({ mode, productId }: { mode: "new" | "edit"; productId?: number }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [price, setPrice] = useState(0);
  const [leadTimeDays, setLeadTimeDays] = useState(1);
  const [celebration, setCelebration] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [allergenIds, setAllergenIds] = useState<number[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [days, setDays] = useState<DayRow[]>([]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(mode === "new");

  // reference data
  useEffect(() => {
    fetch("/api/allergens").then((r) => r.json()).then((d) => setAllergens(d.allergens ?? []));
    fetch("/api/admin/ingredients").then((r) => r.json()).then((d) => setIngredients(d.ingredients ?? []));
  }, []);

  // existing product
  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    (async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          fetch(`/api/admin/products/${productId}`).then((r) => r.json()).catch(() => ({})),
          fetch(`/api/admin/products/${productId}/availability`).then((r) => r.json()).catch(() => ({ days: [] })),
        ]);
        const p: Product | undefined = pRes.product;
        if (!p) {
          setError("Couldn't load this product. Please try again.");
          return;
        }
        const recipes: Record<number, RecipeRow[]> = pRes.recipes ?? {};
        setName(p.name);
      setSlug(p.slug);
      setSlugTouched(true);
      setDescription(p.description);
      setCategory(p.category);
      setPrice(p.price);
      setLeadTimeDays(p.leadTimeDays);
      setCelebration(p.celebration);
      setMetaTitle(p.metaTitle ?? "");
      setMetaDescription(p.metaDescription ?? "");
      setAllergenIds(p.allergens.map((a) => a.id));
      setVariants(
        p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, stockLimit: v.stockLimit, recipe: recipes[v.id] ?? [] }))
      );
        setImages(p.images.map((i) => ({ id: i.id, url: i.url })));
        setDays(aRes.days ?? []);
      } finally {
        setLoaded(true);
      }
    })();
  }, [mode, productId]);

  const onName = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  };

  const toggleAllergen = (id: number) =>
    setAllergenIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  // variants
  const addVariant = () => setVariants((v) => [...v, { label: "", price, stockLimit: null, recipe: [] }]);
  const setVariant = (i: number, patch: Partial<VariantRow>) =>
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const removeVariant = (i: number) => setVariants((vs) => vs.filter((_, idx) => idx !== i));
  const addRecipeRow = (vi: number) =>
    setVariants((vs) => vs.map((v, idx) => (idx === vi ? { ...v, recipe: [...v.recipe, { ingredientId: ingredients[0]?.id ?? 0, amount: 0 }] } : v)));
  const setRecipeRow = (vi: number, ri: number, patch: Partial<RecipeRow>) =>
    setVariants((vs) => vs.map((v, idx) => (idx === vi ? { ...v, recipe: v.recipe.map((r, j) => (j === ri ? { ...r, ...patch } : r)) } : v)));
  const removeRecipeRow = (vi: number, ri: number) =>
    setVariants((vs) => vs.map((v, idx) => (idx === vi ? { ...v, recipe: v.recipe.filter((_, j) => j !== ri) } : v)));

  const save = async () => {
    setError("");
    if (!name.trim()) return setError("Name is required.");
    setSaving(true);
    const payload = { name, slug, description, category, price, leadTimeDays, celebration, metaTitle, metaDescription, allergenIds, variants };
    const res =
      mode === "new"
        ? await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(`/api/admin/products/${productId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || "Save failed.");
    if (mode === "new") router.push(`/dashboard/products/${data.product.id}`);
    else router.refresh();
  };

  // images (edit only)
  const addImageUrl = async () => {
    const url = prompt("Paste an image URL (e.g. a Cloudflare Images delivery URL):");
    if (!url) return;
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const d = await res.json();
    if (res.ok) setImages((im) => [...im, { id: d.id, url: d.url }]);
    else alert(d.error);
  };
  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body: form });
    const d = await res.json();
    if (res.ok) setImages((im) => [...im, { id: d.id, url: d.url }]);
    else alert(d.error);
    e.target.value = "";
  };
  const removeImage = async (imageId: number) => {
    await fetch(`/api/admin/products/${productId}/images/${imageId}`, { method: "DELETE" });
    setImages((im) => im.filter((i) => i.id !== imageId));
  };

  // availability (edit only)
  const toggleDay = async (day: string, available: boolean) => {
    setDays((ds) => {
      const found = ds.find((d) => d.day === day);
      if (found) return ds.map((d) => (d.day === day ? { ...d, available } : d));
      return [...ds, { day, available }];
    });
    await fetch(`/api/admin/products/${productId}/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, available }),
    });
  };

  if (!loaded) return <div style={{ color: "var(--muted)", font: "500 15px Mulish" }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ font: "500 28px 'Playfair Display',serif", color: "var(--ink)", margin: 0 }}>
          {mode === "new" ? "New product" : name || "Edit product"}
        </h1>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ padding: "11px 22px", fontSize: 14, borderRadius: 12 }}>
          {saving ? "Saving…" : "Save product"}
        </button>
      </div>
      {error && <div className="field-error" style={{ marginBottom: 14 }}>{error}</div>}

      {/* Core */}
      <Card title="Details">
        <Row2>
          <F label="Name"><input className="field" value={name} onChange={(e) => onName(e.target.value)} /></F>
          <F label="Slug (URL)"><input className="field" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} /></F>
        </Row2>
        <F label="Description"><textarea className="field" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: "vertical" }} /></F>
        <Row2>
          <F label="Category">
            <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="Base price (£)"><input className="field" type="number" step="0.01" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} /></F>
        </Row2>
        <Row2>
          <F label="Lead time (days)"><input className="field" type="number" min={0} value={leadTimeDays} onChange={(e) => setLeadTimeDays(Number(e.target.value))} /></F>
          <F label="Celebration item">
            <label style={{ display: "flex", alignItems: "center", gap: 8, height: 46, font: "500 14px Mulish", color: "var(--ink)" }}>
              <input type="checkbox" checked={celebration} onChange={(e) => setCelebration(e.target.checked)} />
              Personalised — confirm before event
            </label>
          </F>
        </Row2>
      </Card>

      {/* Allergens */}
      <Card title="Allergens">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {allergens.map((a) => {
            const on = allergenIds.includes(a.id);
            return (
              <button key={a.id} type="button" onClick={() => toggleAllergen(a.id)} className="btn"
                style={{ border: `1.5px solid ${on ? "var(--accent)" : "var(--line)"}`, background: on ? "var(--blush-soft)" : "var(--card)", color: on ? "var(--accent-deep)" : "var(--muted)", padding: "7px 14px", borderRadius: 999, font: "600 13px Mulish" }}>
                {on ? "✓ " : ""}{a.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Variants + recipes */}
      <Card title="Variants & recipes">
        {variants.length === 0 && <p style={{ font: "500 13px Mulish", color: "var(--muted)", margin: "0 0 12px" }}>No variants — the base price is used. Add variants for sizes/boxes.</p>}
        {variants.map((v, vi) => (
          <div key={vi} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 32px", gap: 8, alignItems: "center" }}>
              <input className="field" placeholder="Label (e.g. Serves 10)" value={v.label} onChange={(e) => setVariant(vi, { label: e.target.value })} />
              <input className="field" type="number" step="0.01" placeholder="£" value={v.price} onChange={(e) => setVariant(vi, { price: Number(e.target.value) })} />
              <input className="field" type="number" placeholder="Stock (∞)" value={v.stockLimit ?? ""} onChange={(e) => setVariant(vi, { stockLimit: e.target.value === "" ? null : Number(e.target.value) })} />
              <button type="button" onClick={() => removeVariant(vi)} className="btn" style={{ background: "none", color: "var(--muted)", fontSize: 18 }}>×</button>
            </div>
            {/* recipe */}
            <div style={{ marginTop: 10, paddingLeft: 4 }}>
              <div style={{ font: "600 11px Mulish", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Recipe</div>
              {v.recipe.map((r, ri) => {
                const ing = ingredients.find((x) => x.id === r.ingredientId);
                return (
                  <div key={ri} style={{ display: "grid", gridTemplateColumns: "1fr 90px 60px 28px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <select className="field" value={r.ingredientId} onChange={(e) => setRecipeRow(vi, ri, { ingredientId: Number(e.target.value) })}>
                      {ingredients.map((ig) => <option key={ig.id} value={ig.id}>{ig.name}</option>)}
                    </select>
                    <input className="field" type="number" step="0.01" value={r.amount} onChange={(e) => setRecipeRow(vi, ri, { amount: Number(e.target.value) })} />
                    <span style={{ font: "500 12px Mulish", color: "var(--muted)" }}>{ing?.unit}</span>
                    <button type="button" onClick={() => removeRecipeRow(vi, ri)} className="btn" style={{ background: "none", color: "var(--muted)", fontSize: 16 }}>×</button>
                  </div>
                );
              })}
              <button type="button" onClick={() => addRecipeRow(vi)} disabled={!ingredients.length} className="btn" style={{ background: "none", border: "1px dashed var(--line)", borderRadius: 8, padding: "5px 10px", font: "600 11px Mulish", color: "var(--muted)" }}>
                + ingredient
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addVariant} className="btn" style={{ background: "var(--card)", border: "1.5px solid var(--line)", borderRadius: 999, padding: "8px 16px", font: "600 13px Mulish", color: "var(--ink)" }}>
          + Add variant
        </button>
      </Card>

      {/* SEO */}
      <Card title="SEO">
        <F label="Meta title"><input className="field" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder={name} /></F>
        <F label="Meta description"><textarea className="field" rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} style={{ resize: "vertical" }} /></F>
      </Card>

      {/* Images + availability — edit only (need an id) */}
      {mode === "edit" ? (
        <>
          <Card title="Images">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              {images.map((img) => (
                <div key={img.id} style={{ position: "relative", width: 96, height: 96, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)", background: `#efe5d3 center/cover url('${img.url}')` }}>
                  <button onClick={() => removeImage(img.id)} className="btn" style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,.55)", color: "#fff", borderRadius: 999, width: 22, height: 22, fontSize: 14, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label className="btn" style={{ background: "var(--card)", border: "1.5px solid var(--line)", borderRadius: 999, padding: "8px 16px", font: "600 13px Mulish", color: "var(--ink)", cursor: "pointer" }}>
                Upload file
                <input type="file" accept="image/*" onChange={uploadFile} style={{ display: "none" }} />
              </label>
              <button type="button" onClick={addImageUrl} className="btn" style={{ background: "var(--card)", border: "1.5px solid var(--line)", borderRadius: 999, padding: "8px 16px", font: "600 13px Mulish", color: "var(--ink)" }}>
                Paste URL
              </button>
            </div>
            <p style={{ font: "400 12px Mulish", color: "var(--muted)", marginTop: 8 }}>
              File upload uses Cloudflare Images when configured; otherwise paste a delivery URL.
            </p>
          </Card>

          <Card title="Daily availability">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {days.map((d) => (
                <button key={d.day} type="button" onClick={() => toggleDay(d.day, !d.available)} className="btn"
                  style={{ border: `1.5px solid ${d.available ? "var(--accent)" : "var(--line)"}`, background: d.available ? "var(--blush-soft)" : "var(--card)", color: d.available ? "var(--accent-deep)" : "var(--muted)", padding: "8px 12px", borderRadius: 10, font: "600 12px Mulish" }}>
                  {prettyDate(d.day)} {d.available ? "on" : "off"}
                </button>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <p style={{ font: "400 13px Mulish", color: "var(--muted)" }}>Save the product first to add images and set daily availability.</p>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 24, marginBottom: 16 }}>
      <h2 style={{ font: "500 18px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 14px" }}>{title}</h2>
      {children}
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}
