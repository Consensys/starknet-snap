### Rules for Adding New Fields to the Language File

1. **Key Naming Convention:**

   - Use **English text** to derive the key.
   - The key should be **camelized** (first word lowercase, subsequent words capitalized).
   - Keep the key to **no more than 5 words**.
   - If the text in English is **shorter than 5 words**, camelize the entire phrase.
   - For **longer text**, use a **concise and meaningful key** (this is a soft constraint).

2. **Dynamic Text Placeholders:**

   - Use `{1}`, `{2}`, etc., for dynamic placeholders in messages.
   - Example:
     - `"visitCompanionDappAndUpgrade": { "message": "Visit the [companion dapp for Starknet]({1}) and click “Upgrade”.\nThank you!" }`
     - Usage: `translate("visitCompanionDappAndUpgrade", "https://website.com")`

3. **Consistency:**
   - Ensure key names are meaningful and reflect the message context.
   - Avoid over-complicating keys; aim for clarity and simplicity.

---

These guidelines will ensure consistency and clarity when adding new fields to the language file.
