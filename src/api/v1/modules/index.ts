// library imports
import { Router } from 'express'

// middleware
import * as authRequired from './../../../middleware/auth-required'
import { UpdateModuleController, UpdatePropertyController } from './update'
import { RemovePropertyController } from './remove-property'
import { addRouteName } from '../../../utils/edji-utils'
import { sendResponse, validateIdParameters } from '../../../middleware'
import { createModule, deleteOwnerModule } from './../../../models/_Module'
import { middleware as LegacyAuth } from '../../../middleware/login-controller'
import { addUserToRequest } from '../../../middleware/login-controller'
import createGroup from './create-group'

const router = Router()

/*
  Routes Needed:
    - GET  /                             = Gets all of the modules that the teacher/student can access
    - POST /                             = Create a new module (required: label)
    - GET  /:module_id                   = Returns the specified module by id. Only return it if the user has access to it (teacher, co_owner, student)
    - PUT  /:module_id                   = Allows a user to modify the module if they are the teacher or co_owner
    - DEL  /:module_id                   = Allows a user to delete the module, and consequently, all of the readings/groups that belong to it if the user is a teacher or co_owner.
    - POST /:module_id                   = Creates a new group inside of the module (required: label) [automatically generates projects]
    - PUT  /:module_id/:update_property  = Allows a user to update a property on the module. Using this endpoint, users should be able to update base module properties.
    - DEL  /:module_id/:remove_property  = Allows a user to remove a property from the module (as of now, only controllers needed are for removing readings, along with removing projects from readings.) 
*/

// DONE
router.get('/', addRouteName('/'), LegacyAuth, authRequired, require('./list'))
router.post('/', addRouteName('/'), LegacyAuth, authRequired, createModule(), sendResponse())
router.get('/:module_id', addRouteName('/:module_id'), LegacyAuth, require('./retrieve'))
router.delete(
  '/:module_id',
  addRouteName('/:module_id'),
  addUserToRequest(),
  authRequired,
  validateIdParameters('module_id'),
  deleteOwnerModule(),
  sendResponse(),
)
router.put(
  '/:module_id',
  addRouteName('/:module_id'),
  addUserToRequest(),
  validateIdParameters('module_id'),
  authRequired,
  UpdateModuleController,
)
router.put(
  '/:module_id/:update_property',
  addRouteName('/:module_id/:update_property'),
  addUserToRequest({ type: true, fullname: true }),
  authRequired,
  validateIdParameters('module_id'),
  UpdatePropertyController,
)

// TODO
router.post('/:module_id', addRouteName('/:module_id'), LegacyAuth, authRequired, createGroup)
router.delete(
  '/:module_id/:remove_property',
  addRouteName('/:module_id/:remove_property'),
  addUserToRequest(),
  authRequired,
  validateIdParameters('module_id'),
  RemovePropertyController,
)

export default router
