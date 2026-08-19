// src/main/controllers/cashSessionController/cashSessionController.js
import CashSession from '../../models/cashSessionModel';

// Open a new cash session
const handleOpenSession = async (data) => {
  try {
    const {
      store_id,
      device_id,
      device_name,
      hostname,
      platform,
      hardware_serial,
      opened_by_id,
      opened_by_email,
      opened_by_name,
      opening_cash
    } = data;

    if (!store_id || !device_id || !opened_by_id || opening_cash == null) {
      return { success: false, error: 'Missing required fields to open a session' };
    }

    // Guard: block if this device already has an open session
    const existingDeviceSession = await CashSession.findOne({
      device_id,
      status: 'open'
    });

    if (existingDeviceSession) {
      return {
        success: false,
        error: 'This device already has an open cash session. Please close it before opening a new one.'
      };
    }

    // Guard: block if this user already has an open session (on any device)
    const existingUserSession = await CashSession.findOne({
      opened_by_id,
      status: 'open'
    });

    if (existingUserSession) {
      return {
        success: false,
        error: 'You already have an active cash session open. Please close it before opening a new one.'
      };
    }

    // session_number: sequential per store per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaySessionCount = await CashSession.countDocuments({
      store_id,
      opening_time: { $gte: startOfDay }
    });

    const newSession = new CashSession({
      store_id,
      session_number: todaySessionCount + 1,
      device_id,
      device_name,
      hostname,
      platform,
      hardware_serial,
      opened_by_id,
      opened_by_email,
      opened_by_name,
      opening_time: new Date(),
      opening_cash,
      status: 'open'
    });

    const savedSession = await newSession.save();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(savedSession))
    };
  } catch (error) {
    console.error('handleOpenSession error:', error);
    return { success: false, error: error.message || 'Failed to open cash session' };
  }
};

// Close an existing cash session
const handleCloseSession = async (data) => {
  try {
    const {
      _id,
      closed_by_id,
      closed_by_email,
      closed_by_name,
      actual_cash,
      variance_note,
      approved_by_id,
      approved_by_email
    } = data;

    if (!_id || !closed_by_id || actual_cash == null) {
      return { success: false, error: 'Missing required fields to close a session' };
    }

    const session = await CashSession.findById(_id);

    if (!session) {
      return { success: false, error: 'Cash session not found' };
    }

    if (session.status === 'closed') {
      return { success: false, error: 'This session is already closed' };
    }

    // NOTE: sales cash total should be added here once the Sales module
    // exists (query sales by session_id, sum cash-tendered amounts).
    const expected_cash = session.opening_cash;
    const variance = actual_cash - expected_cash;

    const VARIANCE_APPROVAL_THRESHOLD = 200; // Rs.

    if (Math.abs(variance) > VARIANCE_APPROVAL_THRESHOLD && !approved_by_id) {
      return {
        success: false,
        error: `Variance of ${variance} exceeds allowed threshold. Manager approval required.`
      };
    }

    session.status = 'closed';
    session.closed_by_id = closed_by_id;
    session.closed_by_email = closed_by_email;
    session.closed_by_name = closed_by_name;
    session.closing_time = new Date();
    session.expected_cash = expected_cash;
    session.actual_cash = actual_cash;
    session.variance = variance;
    session.variance_note = variance_note || '';
    session.approved_by_id = approved_by_id || null;
    session.approved_by_email = approved_by_email || null;

    const updatedSession = await session.save();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedSession))
    };
  } catch (error) {
    console.error('handleCloseSession error:', error);
    return { success: false, error: error.message || 'Failed to close cash session' };
  }
};

// Check if there's already an active session for this user or this device (any store)
const handleCheckActiveSession = async (data) => {
  try {
    const { device_id, user_id } = data;

    if (!device_id && !user_id) {
      return { success: false, error: 'device_id or user_id is required' };
    }

    const existing = await CashSession.findOne({
      status: 'open',
      $or: [{ device_id }, { opened_by_id: user_id }]
    });

    return {
      success: true,
      data: existing ? JSON.parse(JSON.stringify(existing)) : null
    };
  } catch (error) {
    console.error('handleCheckActiveSession error:', error);
    return { success: false, error: error.message || 'Failed to check active session' };
  }
};

// Get all currently open sessions for a store (for the "active sessions" dashboard)
const handleGetActiveSessions = async (data) => {
  try {
    const { store_id } = data;

    if (!store_id) {
      return { success: false, error: 'store_id is required' };
    }

    const sessions = await CashSession.find({ store_id, status: 'open' }).sort({
      opening_time: -1
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(sessions))
    };
  } catch (error) {
    console.error('handleGetActiveSessions error:', error);
    return { success: false, error: error.message || 'Failed to fetch active sessions' };
  }
};

// Get a single session by id
const handleGetSessionById = async (data) => {
  try {
    const { _id } = data;

    if (!_id) {
      return { success: false, error: 'Session _id is required' };
    }

    const session = await CashSession.findById(_id);

    if (!session) {
      return { success: false, error: 'Cash session not found' };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(session))
    };
  } catch (error) {
    console.error('handleGetSessionById error:', error);
    return { success: false, error: error.message || 'Failed to fetch cash session' };
  }
};

// Get all sessions for a store (history/reporting view)
const handleGetAllSessions = async (data) => {
  try {
    const { store_id } = data;

    if (!store_id) {
      return { success: false, error: 'store_id is required' };
    }

    const sessions = await CashSession.find({ store_id }).sort({ opening_time: -1 });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(sessions))
    };
  } catch (error) {
    console.error('handleGetAllSessions error:', error);
    return { success: false, error: error.message || 'Failed to fetch cash sessions' };
  }
};

export {
  handleOpenSession,
  handleCloseSession,
  handleCheckActiveSession,
  handleGetActiveSessions,
  handleGetSessionById,
  handleGetAllSessions
};
