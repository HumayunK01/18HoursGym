import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { planRouter } from './plan.routes.js';
import { checkoutRouter } from './checkout.routes.js';
import { classRouter } from './class.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();

apiRouter.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.redirect('/api/docs');
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      name: 'Gym Management API',
      version: 'v1',
      status: 'online',
      documentation: `${req.protocol}://${req.get('host')}/api/docs`,
      resources: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        plans: '/api/v1/plans',
        checkout: '/api/v1/checkout',
        classes: '/api/v1/classes',
        admin: '/api/v1/admin',
      },
    },
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/plans', planRouter);
apiRouter.use('/checkout', checkoutRouter);
apiRouter.use('/classes', classRouter);
apiRouter.use('/admin', adminRouter);
