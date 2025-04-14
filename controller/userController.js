import messageUtil from '../utilities/message.js';
import userService from '../services/userService.js';
import {
  bcryptHash,
  comparePassword,
  hashPassword,
} from '../utilities/password.js';
import jwtHelper from '../utilities/jwt.js';
import Response from '../utilities/response.js';
import mongoose from 'mongoose';
import User from '../model/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

class UserController {
  SignUp = async (req, res) => {
    try {
      // find the user for the emeil
      let user = await userService.findUser({ email: req.body.email });
      // check the exist or not
      if (user) {
        return Response.ExistallReady(res, messageUtil.ALL_READY_EXIST);
      }
      // signup the user
      user = await userService.createUser({
        ...req.body,
        password: await bcryptHash(req.body.password), // hash the password
      });
      // user.password = await bcryptHash(req.body.password);
      // user.save();
      const token = await jwtHelper.issue({ _id: user._id });

      return Response.success(res, messageUtil.USER_CREATED, user, token); // return a response the user created sucessfully
    } catch (error) {
      // return a response of server error
      return Response.serverError(res, error);
    }
  };
  Login = async (req, res) => {
    try {
      // find the user via emeil
      let user = await userService.findUser({ email: req.body.email });
      // check user exist or not
      if (!user) {
        return Response.notfound(res, messageUtil.NOT_FOUND); // return the response
      }
      // check the password correct or not
      const isMatch = await comparePassword(req.body.password, user.password);
      if (!isMatch) {
        return Response.authorizationError(res, messageUtil.INCORRECT_PASSWORD); // return the response of incorrect password
      }
      // issue the token
      const token = await jwtHelper.issue({ _id: user._id });
      return Response.success(res, messageUtil.LOGIN_SUCCESS, user, token); // return the response
    } catch (error) {
      // return the response of the error
      return Response.serverError(res, error);
    }
  };
  getAllUser = async (req, res) => {
    try {
      // Ensure the user is authenticated
      if (!req.user) {
        return Response.unauthorized(res, messageUtil.UNAUTHORIZED);
      }
      let users;
      // find all user in database
      users = await userService.findAll(req.query);
      // check user exist or not
      if (!users) {
        return Response.notfound(res, messageUtil.NOT_FOUND); // return the response
      }
      return Response.success(res, messageUtil.OK, users); // return the response
    } catch (error) {
      // return the response server error
      return Response.serverError(res, error);
    }
  };

  getOnlyId = async (req, res) => {
    try {
      // Extract user ID from the authenticated request (decoded from token)
      const id = req.userId;

      // Find user in database using the extracted I
      let user = await userService.findUserId(id);

      if (!user) {
        // Check if user exists
        return Response.notfound(res, messageUtil.NOT_FOUND);
      } else {
        return Response.success(res, messageUtil.OK, user);
      }
    } catch (error) {
      // Handle server error
      return Response.serverError(res, error);
    }
  };
  getById = async (req, res) => {
    const userId = req.params.userId;
    try {
      // Pass only the ID string
      let user = await userService.findUserId(userId, req.userId);

      if (!user) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      } else {
        return Response.success(res, messageUtil.OK, user);
      }
    } catch (error) {
      console.error('Error in getById:', error);
      return Response.serverError(res, error);
    }
  };
  userUpdate = async (req, res) => {
    try {
      const userId = req.pa;
      rams.userId;

      //  Ensure userId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return Response.badRequest(res, 'Invalid User ID');
      }

      //  Find user using `_id`, not `id`
      let user = await userService.findUser({
        _id: new mongoose.Types.ObjectId(userId),
      });
      // check user exist or not
      if (!user) {
        return Response.notfound(res, messageUtil.NOT_FOUND); // return the response
      }

      //  Pass the correct ID for updating the user
      user = await userService.updateUser({ _id: userId }, req.body);
      // check user exist or not
      if (!user) {
        return Response.notfound(res, messageUtil.NOT_FOUND); // return the response
      }
      // return the response of sucess
      return Response.success(res, messageUtil.OK, user);
    } catch (error) {
      // console.error('Error updating user:', error);
      return Response.serverError(res, error); // return the response server error
    }
  };
  userDelete = async (req, res) => {
    try {
      const adminId = req.userId; // The user making the request (assumed to be admin)
      const userId = req.params.userId; // The user to be deleted

      // ✅ Check if admin exists & has admin role
      // const admin = await userService.findUser({ _id: adminId });

      // if (!admin || admin.role !== 'admin') {
      //   return Response.authorizationError(res, messageUtil.UNAUTHORIZED);
      // }

      // ✅ Check if the user to delete exists
      const user = await userService.findUser({ _id: userId });

      if (!user) {
        return Response.notfound(res, messageUtil.NOT_FOUND); // return the response
      }

      // ✅ Delete the user
      const deletedUser = await userService.deleteUser({ _id: userId });

      if (!deletedUser) {
        return Response.notfound(res, messageUtil.NOT_FOUND); // return the response
      }

      return Response.success(res, messageUtil.OK, deletedUser); // return the response
    } catch (error) {
      // console.error('Error deleting user:', error);
      return Response.serverError(res, error); // return the response
    }
  };

  // Forget password
  forgetPassword = async (req, res) => {
    try {
      const { email } = req.body;
      // check tue email
      if (!email) {
        return Response.badRequest(res, messageUtil.EMAIL_REQUIRED); // return the response
      }
      // find the email of user
      const checkUser = await User.findOne({ email });
      // check the user exist or not
      if (!checkUser) {
        return Response.notfound(res, messageUtil.REGISTER_AGAIN);
      }

      const token = jwt.sign({ email }, process.env.SECRETKEY, {
        expiresIn: '1h',
      });

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const receiver = {
        from: 'wishpostings@gmail.com',
        to: email,
        subject: 'Password Reset Request',
        text: `Click on this link to generate your new password ${process.env.CLIENT_URL}/reset-password/${token}`,
      };

      await transporter.sendMail(receiver);
      return Response.success(
        res,
        'Password reset link send successfully on your gmail account'
      );
    } catch (error) {
      return Response.serverError(res, error);
      //return res.status(500).send({ message: 'Something went wrong' });
    }
  };
  // Reset Password
  resetPassword = async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      // check the passowrd
      if (!password) {
        return Response.badRequest(res, messageUtil.PASSWORD_REQUIRED);
        // return res.status(400).send({ message: 'Please provide password' });
      }

      const decode = jwt.verify(token, process.env.SECRETKEY);
      // find the user by email
      const user = await User.findOne({ email: decode.email });
      // hash new poassword
      const newhashPassword = await hashPassword(password);

      user.password = newhashPassword;
      // save new password in database
      await user.save();
      // return the response
      return Response.success(res, 'Password reset successfully'); // return the response
    } catch (error) {
      // return the response server error
      return Response.serverError(res, error);
    }
  };
  changePassword = async (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;

      if (!email || !currentPassword || !newPassword) {
        return Response.badRequest(res, messageUtil.REQUIRED_ALL_FIELD);
        // return res
        //   .status(400)
        //   .send({ message: 'Please provide all required fields' });
      }

      const checkUser = await User.findOne({ email });

      if (!checkUser) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
        // return res
        //   .status(400)
        //   .send({ message: 'User not found please register' });
      }

      const isMatchPassword = await comparePassword(
        currentPassword,
        checkUser.password
      );

      if (!isMatchPassword) {
        return Response.badRequest(res, messageUtil.PASSWORD_NOT_MATCH);
        // return res
        //   .status(400)
        //   .send({ message: 'Current password does not match' });
      }

      const newHashPassword = await hashPassword(newPassword);

      await User.updateOne({ email }, { password: newHashPassword });
      return Response.success(res, messageUtil.OK);
      // return res.status(200).send({ message: 'Password change successfully' });
    } catch (error) {
      return Response.serverError(res, error);
      // return res.status(500).send({ message: 'Something went wrong' });
    }
  };
}
export default new UserController();
