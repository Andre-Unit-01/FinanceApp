// Category controllers translate HTTP requests into category service calls.
// They do not contain category ownership or database rules.
import { listCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await listCategories(req.user.id);
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const category = await createCategory(req.user.id, req.body);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const category = await updateCategory(req.user.id, req.params.id, req.body);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const result = await deleteCategory(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
