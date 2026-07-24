import Service from '../../models/serviceModel';

/**
 * Helper: safely serialize Mongoose documents for the Electron IPC bridge.
 * .toJSON() alone is not enough — ObjectId.prototype.toJSON() is not invoked
 * by the structured clone algorithm, so we force a plain JSON round-trip.
 */
const serialize = (doc) => JSON.parse(JSON.stringify(doc));

/**
 * Create a new service
 * @param {Object} data - { service_name, service_code, category, description, cost, price, tax_rate, status, added_by }
 * Note: services are not store-scoped — no store_id.
 */
export const createService = async (data) => {
  try {
    const {
      service_name,
      service_code,
      category,
      description,
      cost,
      price,
      tax_rate,
      status,
      added_by,
    } = data;

    if (!service_name || !service_code || !category) {
      return {
        success: false,
        error: 'service_name, service_code and category are required',
      };
    }

    const existing = await Service.findOne({ service_code: service_code.trim() });
    if (existing) {
      return {
        success: false,
        error: `Service code "${service_code}" is already in use`,
      };
    }

    const service = await Service.create({
      service_name,
      service_code: service_code.trim(),
      category,
      description,
      cost,
      price,
      tax_rate,
      status,
      added_by,
    });

    const populated = await service.populate('category', 'categoryName image');

    return { success: true, data: serialize(populated) };
  } catch (error) {
    if (error.code === 11000) {
      return { success: false, error: 'Service code must be unique' };
    }
    console.error('createService error:', error);
    return { success: false, error: error.message || 'Failed to create service' };
  }
};

/**
 * Get paginated list of services with optional filters
 * @param {Object} params - { page, limit, category, status, search }
 *   limit: pass 'all' (or omit) for no pagination
 */
export const getServices = async (params = {}) => {
  try {
    const { page = 1, limit = 10, category, status, search } = params;

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { service_name: { $regex: search, $options: 'i' } },
        { service_code: { $regex: search, $options: 'i' } },
      ];
    }

    let dbQuery = Service.find(query)
      .populate('category', 'categoryName image')
      .sort({ createdAt: -1 });

    let total = await Service.countDocuments(query);

    if (limit !== 'all' && limit != null) {
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
      dbQuery = dbQuery.skip((pageNum - 1) * limitNum).limit(limitNum);

      const services = await dbQuery.exec();

      return {
        success: true,
        data: serialize(services),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    }

    const services = await dbQuery.exec();
    return {
      success: true,
      data: serialize(services),
      pagination: { total, page: 1, limit: total, totalPages: 1 },
    };
  } catch (error) {
    console.error('getServices error:', error);
    return { success: false, error: error.message || 'Failed to fetch services' };
  }
};

/**
 * Get a single service by ID
 * @param {String} id
 */
export const getServiceById = async (id) => {
  try {
    const service = await Service.findById(id).populate('category', 'categoryName image');
    if (!service) {
      return { success: false, error: 'Service not found' };
    }
    return { success: true, data: serialize(service) };
  } catch (error) {
    console.error('getServiceById error:', error);
    return { success: false, error: error.message || 'Failed to fetch service' };
  }
};

/**
 * Update a service by ID
 * @param {String} id
 * @param {Object} data - fields to update
 */
export const updateService = async (id, data) => {
  try {
    const { service_code } = data;

    if (service_code) {
      const existing = await Service.findOne({
        service_code: service_code.trim(),
        _id: { $ne: id },
      });
      if (existing) {
        return {
          success: false,
          error: `Service code "${service_code}" is already in use`,
        };
      }
      data.service_code = service_code.trim();
    }

    const service = await Service.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('category', 'categoryName image');

    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    return { success: true, data: serialize(service) };
  } catch (error) {
    if (error.code === 11000) {
      return { success: false, error: 'Service code must be unique' };
    }
    console.error('updateService error:', error);
    return { success: false, error: error.message || 'Failed to update service' };
  }
};

/**
 * Hard delete a service by ID
 * @param {String} id
 */
export const deleteService = async (id) => {
  try {
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return { success: false, error: 'Service not found' };
    }
    return { success: true, message: 'Service deleted successfully' };
  } catch (error) {
    console.error('deleteService error:', error);
    return { success: false, error: error.message || 'Failed to delete service' };
  }
};
