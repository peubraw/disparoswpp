DELETE FROM "Contact" WHERE id NOT IN (
  SELECT MIN(id) FROM "Contact" GROUP BY "contactListId", "phoneNumber"
);
