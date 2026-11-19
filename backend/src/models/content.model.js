'use strict';

const db = require('../config/db');

async function facilities() {
  const rows = await db.query(
    `SELECT id, name, description, icon, image_url
       FROM facilities WHERE is_active = 1 ORDER BY display_order, id`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    imageUrl: r.image_url,
  }));
}

async function gallery(category) {
  const params = [];
  let where = 'WHERE is_active = 1';
  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }
  const rows = await db.query(
    `SELECT id, title, image_url, category FROM gallery_images ${where} ORDER BY display_order, id`,
    params
  );
  return rows.map((r) => ({ id: r.id, title: r.title, imageUrl: r.image_url, category: r.category }));
}

module.exports = { facilities, gallery };