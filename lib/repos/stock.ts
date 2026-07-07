// Ingredient stock + auto-calculated shopping list.
import { sql } from "@/lib/db";
import { num } from "@/lib/money";

type Row = Record<string, unknown>;

export async function adjustIngredientStock(id: number, stock: number) {
  await sql`UPDATE ingredients SET stock = ${stock} WHERE id = ${id}`;
}

export interface ShoppingLine {
  id: number;
  name: string;
  unit: string;
  category: string;
  stock: number;
  required: number;
  toBuy: number;
}

/**
 * Shopping list from outstanding orders (confirmed + ready — i.e. paid and
 * still to be baked) × recipes, grouped by ingredient category.
 * toBuy = required − current stock (never below zero).
 */
export async function getShoppingList(): Promise<{ category: string; lines: ShoppingLine[] }[]> {
  const rows = (await sql`
    SELECT i.id, i.name, i.unit, i.category, i.stock,
           COALESCE(SUM(oi.quantity * ri.amount), 0) AS required
    FROM ingredients i
    LEFT JOIN recipe_items ri ON ri.ingredient_id = i.id
    LEFT JOIN order_items oi ON oi.variant_id = ri.variant_id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('confirmed', 'ready')
    GROUP BY i.id
    HAVING COALESCE(SUM(oi.quantity * ri.amount), 0) > 0
    ORDER BY i.category, i.name
  `) as Row[];

  const lines: ShoppingLine[] = rows.map((r) => {
    const stock = num(r.stock);
    const required = num(r.required);
    return {
      id: Number(r.id),
      name: String(r.name),
      unit: String(r.unit),
      category: String(r.category),
      stock,
      required,
      toBuy: Math.max(0, Math.round((required - stock) * 100) / 100),
    };
  });

  const groups = new Map<string, ShoppingLine[]>();
  for (const l of lines) {
    if (!groups.has(l.category)) groups.set(l.category, []);
    groups.get(l.category)!.push(l);
  }
  return [...groups.entries()].map(([category, lines]) => ({ category, lines }));
}
